import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Monster } from '../entity/monster.entity';
import { GameState } from '../entity/user.entity';
import { MonsterGrade, MONSTER_BOOK } from '../data/monsters.data';
import { WEAPON_BOOK } from '../data/items.data';
import { UserService } from './user.service';

@Injectable()
export class BattleService {
    constructor(
        @InjectRepository(Monster) private monsterRepo: Repository<Monster>,
        private readonly userService: UserService,
    ) { }

    async spawnMonster(turn: number) {
        const availableMonsters = MONSTER_BOOK.filter(m =>
            m.minTurn <= turn && m.grade !== MonsterGrade.BOSS
        );

        let spec = availableMonsters.length > 0
            ? availableMonsters[Math.floor(Math.random() * availableMonsters.length)]
            : MONSTER_BOOK[0];

        const scaling = 1 + (turn * 0.05);

        const newMonster = this.monsterRepo.create({
            specId: spec.id,
            name: spec.name,
            maxHp: Math.floor(spec.baseHp * scaling),
            hp: Math.floor(spec.baseHp * scaling),
            attack: Math.floor(spec.baseAtk * scaling),
            defense: spec.def,
            agi: Math.floor(spec.baseAgi * scaling),
            nextAction: Math.random() < 0.7 ? 'ATTACK' : 'DEFENSE',
            rewardGold: Math.floor(spec.gold * scaling),
            imagePath: spec.image
        });

        return await this.monsterRepo.save(newMonster);
    }

    async spawnRandomBoss(turn: number) {
        const lords = MONSTER_BOOK.filter(m => m.grade === MonsterGrade.BOSS);
        const lordSpec = lords[Math.floor(Math.random() * lords.length)];
        const scaling = 1 + (turn * 0.05);

        const boss = this.monsterRepo.create({
            specId: lordSpec.id,
            name: lordSpec.name,
            maxHp: Math.floor(lordSpec.baseHp * scaling),
            hp: Math.floor(lordSpec.baseHp * scaling),
            attack: Math.floor(lordSpec.baseAtk * scaling),
            defense: lordSpec.def,
            agi: Math.floor(lordSpec.baseAgi * scaling),
            nextAction: Math.random() < 0.8 ? 'ATTACK' : 'DEFENSE',
            rewardGold: Math.floor(lordSpec.gold * scaling),
            imagePath: lordSpec.image
        });

        return await this.monsterRepo.save(boss);
    }

    async battleAction(userId: number, monsterId: number, action: string, useLucky: boolean) {
        const user = await this.userService.findOne(userId);
        const monster = await this.monsterRepo.findOne({ where: { id: monsterId } });

        if (!user || !monster) throw new NotFoundException('대상 찾을 수 없음');
        if (!user.gameData) throw new BadRequestException('진행 중인 게임이 없습니다.');

        if (user.gameData.state === GameState.GAME_OVER) {
            return { result: 'LOSE', logs: ['이미 사망했습니다.'], userHp: 0, monsterHp: monster.hp };
        }

        const logs: string[] = [];
        if (user.gameData.luckyCooldown === undefined) user.gameData.luckyCooldown = 0;

        // 1. 기절 체크 및 처리
        if (user.gameData.stunned) {
            return await this.handlePlayerStun(user, monster, logs);
        }

        const monsterAction = monster.nextAction || 'ATTACK';
        let monsterDmg = monster.attack + Math.floor(Math.random() * 3);

        // 2. 주사위(Lucky Attack) 배율 결정
        const luckyMultiplier = this.resolveLuckFactor(user, useLucky, logs);

        // 3. 플레이어 데미지 계산 및 행동 처리
        let playerFinalDmg = 0;
        const playerBaseDmg = Math.max(1, Math.round((WEAPON_BOOK[user.gameData.equippedWeapon!]?.atk || 0) + (user.gameData.str * 0.5)));

        if (action === 'DEFENSE') {
            logs.push(`🛡️ [방어] 태세! (피해 70% 감소)`);
            if (monsterAction === 'ATTACK') {
                const reducedDmg = Math.floor(monsterDmg * 0.3);
                user.gameData.hp -= reducedDmg;
                logs.push(`👾 몬스터 공격! 방어로 ${reducedDmg} 피해만 입었습니다.`);
            } else {
                logs.push(`👾 몬스터도 방어하며 대치 중...`);
            }
        } else if (action === 'STRONG_ATTACK') {
            logs.push(`💪 [강공격] 시도! (방어 무시 + 130%)`);
            const skillDmg = Math.floor(playerBaseDmg * 1.3 * luckyMultiplier);
            if (monsterAction === 'DEFENSE') {
                playerFinalDmg = skillDmg;
                logs.push(`🔨 몬스터가 방어했지만 강공격으로 뚫었습니다! (데미지 ${playerFinalDmg})`);
            } else {
                if (user.gameData.agi >= monster.agi) {
                    playerFinalDmg = skillDmg;
                    user.gameData.hp -= monsterDmg;
                    user.gameData.stunned = true;
                    logs.push(`⚡ 선공 성공! 데미지를 주고 반격받았습니다. (반동으로 다음 턴 기절)`);
                } else {
                    playerFinalDmg = 0;
                    user.gameData.hp -= monsterDmg;
                    user.gameData.stunned = true;
                    logs.push(`🐌 너무 느립니다! 공격하기 전에 맞아 캔슬되었습니다. (다음 턴 기절)`);
                }
            }
        } else {
            logs.push(`⚔️ [일반 공격]!`);
            playerFinalDmg = Math.floor(playerBaseDmg * luckyMultiplier);
            if (monsterAction === 'DEFENSE') {
                playerFinalDmg = Math.floor(playerFinalDmg * 0.3);
                logs.push(`🛡️ 몬스터 방어 (데미지 70% 감소)`);
            } else {
                user.gameData.hp -= monsterDmg;
                logs.push(`👾 서로 공격 교환! (-${monsterDmg} HP)`);
            }
        }

        // 4. 데미지 반영 및 결과 처리
        return await this.applyBattleOutcome(user, monster, playerFinalDmg, logs);
    }

    // --- Private Refactored Methods ---

    private async handlePlayerStun(user: any, monster: any, logs: string[]) {
        user.gameData.stunned = false;
        if (user.gameData.luckyCooldown > 0) user.gameData.luckyCooldown--;

        const monsterAction = monster.nextAction || 'ATTACK';
        let monsterDmg = monster.attack + Math.floor(Math.random() * 3);

        if (monsterAction === 'ATTACK') {
            user.gameData.hp -= monsterDmg;
            logs.push(`😵 기절하여 움직일 수 없습니다! (샌드백 신세... -${monsterDmg} HP)`);
        } else {
            logs.push(`😵 기절해 있었지만 다행히 몬스터도 방어했습니다.`);
        }

        if (user.gameData.hp <= 0) {
            user.gameData.hp = 0;
            user.gameData.state = GameState.GAME_OVER;
            logs.push(`💀 기절 상태에서 공격받아 쓰러졌습니다...`);
            await this.userService.save(user);
            return { result: 'LOSE', logs, monsterHp: monster.hp, userHp: 0, monsterAction, luckyCooldown: user.gameData.luckyCooldown };
        }

        await this.userService.save(user);
        const nextMonsterIntent = user.gameData.agi >= monster.agi ? monster.nextAction : '?';
        return {
            result: 'CONTINUE',
            logs,
            monsterHp: monster.hp,
            userHp: user.gameData.hp,
            monsterAction,
            nextMonsterIntent,
            canSeeIntent: user.gameData.agi >= monster.agi,
            luckyCooldown: user.gameData.luckyCooldown
        };
    }

    private resolveLuckFactor(user: any, useLucky: boolean, logs: string[]): number {
        if (!useLucky) return 1.0;

        if (user.gameData.luckyCooldown > 0) {
            logs.push(`⚠️ 럭키 어택 쿨타임입니다! (남은 턴: ${user.gameData.luckyCooldown}) -> 일반 공격으로 진행`);
            return 1.0;
        }

        logs.push(`🎲 [이판사판] 주사위를 굴립니다... (1~6)`);
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const sum = dice1 + dice2;

        user.gameData.luckyCooldown = 3;

        if (dice1 === dice2) {
            logs.push(`🎰 잭팟! (${dice1}, ${dice2}) -> 배율 3.0배! (초강력)`);
            return 3.0;
        } else {
            // 최소 3(0.8배) ~ 최대 11(1.6배)
            const multi = 0.5 + (sum / 10);
            logs.push(`🎲 결과: ${dice1}, ${dice2} (합 ${sum}) -> 배율 ${multi.toFixed(1)}배`);
            return multi;
        }
    }

    private async applyBattleOutcome(user: any, monster: any, playerFinalDmg: number, logs: string[]) {
        const monsterAction = monster.nextAction || 'ATTACK';

        if (playerFinalDmg > 0) {
            monster.hp = Math.max(0, monster.hp - playerFinalDmg);
            logs.push(`💥 몬스터에게 ${playerFinalDmg} 피해!`);
        }

        if (user.gameData.hp <= 0) {
            user.gameData.hp = 0;
            user.gameData.state = GameState.GAME_OVER;
            logs.push(`💀 체력이 다했습니다... 당신은 쓰러졌습니다.`);
            await this.userService.save(user);
            return { result: 'LOSE', logs, monsterHp: monster.hp, userHp: 0, monsterAction };
        }

        let result = 'CONTINUE';
        if (monster.hp === 0) {
            result = 'WIN';
            if (user.gameData.state === GameState.BOSS_BATTLE) {
                logs.push(`🏆 군주 ${monster.name} 토벌 완료!`);
                user.gameData.maxHp += 20;
                user.gameData.hp += 20;
                logs.push(`✨ 보스 토벌 기념으로 최대 체력이 20 상승했습니다! (+20 Max HP)`);
            } else {
                logs.push(`🎉 승리!`);
            }
            user.gameData.gold = (user.gameData.gold || 0) + monster.rewardGold;
            await this.monsterRepo.remove(monster);
        } else {
            monster.nextAction = Math.random() < 0.7 ? 'ATTACK' : 'DEFENSE';
            await this.monsterRepo.save(monster);
        }

        if (user.gameData.luckyCooldown > 0) user.gameData.luckyCooldown--;
        await this.userService.save(user);

        const canSeeIntent = monster.hp > 0 && user.gameData.agi >= monster.agi;
        const nextMonsterIntent = monster.hp > 0 ? (canSeeIntent ? monster.nextAction : '?') : null;

        return {
            result, logs, monsterHp: monster.hp, userHp: user.gameData.hp,
            monsterAction, nextMonsterIntent, canSeeIntent,
            luckyCooldown: user.gameData.luckyCooldown,
            gold: user.gameData.gold
        };
    }

    async claimVictoryReward(userId: number, reward: 'STR' | 'AGI' | 'POTION') {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);
        if (!user.gameData) throw new BadRequestException('진행 중인 게임이 없습니다.');

        let message = '';
        if (reward === 'STR') {
            const val = Math.floor(Math.random() * 3) + 1; // 1~3
            user.gameData.str += val;
            message = `힘수치가 ${val} 상승했습니다!`;
        } else if (reward === 'AGI') {
            const val = Math.floor(Math.random() * 5) + 1; // 1~5
            user.gameData.agi += val;
            message = `민첩성이 ${val} 상승했습니다!`;
        } else if (reward === 'POTION') {
            const val = Math.floor(Math.random() * 3); // 0~2
            user.gameData.potions = (user.gameData.potions || 0) + val;
            message = `포션을 ${val}개 획득했습니다! (현재 갯수: ${user.gameData.potions})`;
        } else {
            throw new BadRequestException('잘못된 보상 선택입니다.');
        }

        await this.userService.save(user);
        return { message, str: user.gameData.str, agi: user.gameData.agi, potions: user.gameData.potions };
    }

    async escape(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);
        if (!user.gameData) throw new BadRequestException('진행 중인 게임이 없습니다.');

        if (user.gameData.state === GameState.BATTLE || user.gameData.state === GameState.BOSS_BATTLE) {
            user.gameData.state = GameState.SELECTING;
            await this.userService.save(user);
        }
        return { message: '탈출 성공', state: GameState.SELECTING };
    }
}
