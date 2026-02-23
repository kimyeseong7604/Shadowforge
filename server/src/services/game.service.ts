import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GameState } from '../entity/user.entity';
import { UserService } from './user.service';
import { BattleService } from './battle.service';

@Injectable()
export class GameService {
    constructor(
        private readonly userService: UserService,
        private readonly battleService: BattleService,
    ) { }

    // 🔀 섞기 함수
    private shuffle(array: string[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 🎲 랜덤 선택지 생성
    public generateOptions() {
        const result = ['BATTLE'];
        let pool = ['BATTLE', 'SHOP', 'REST', 'TREASURE'];

        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const picked = pool[randomIndex];
            result.push(picked);
            if (picked !== 'BATTLE') {
                pool = pool.filter(item => item !== picked);
            }
        }
        return this.shuffle(result);
    }

    async startGame(userId: number) {
        const initialData = {
            currentTurn: 1,
            state: GameState.SELECTING,
            options: this.generateOptions(),
            hp: 100,
            maxHp: 100,
            str: 10,
            agi: 10,
            stunned: false,
            luckyCooldown: 0,
            gold: 0,
            potions: 0,
            inventory: [],
            equippedWeapon: null,
            nextMonsterIntent: null,
            canSeeIntent: false,
            maxHpBonusCount: 0,
            potionPurchaseCount: 0,
        };

        const user = await this.userService.findOrCreateUser(userId, initialData);

        // Existing user reset logic
        if (user.gameData.currentTurn !== 1 || user.gameData.state !== GameState.SELECTING) {
            user.gameData = initialData;
            await this.userService.save(user);
        }

        return {
            message: '새로운 모험이 시작됩니다!',
            turn: 1,
            options: user.gameData.options,
            state: GameState.SELECTING
        };
    }

    async nextTurn(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (user.gameData.state === GameState.GAME_OVER) {
            throw new BadRequestException('게임 오버 상태입니다.');
        }

        // 1. 엔딩 체크
        if (user.gameData.state === GameState.BOSS_BATTLE && user.gameData.currentTurn >= 15) {
            user.gameData.state = GameState.GAME_CLEAR;
            await this.userService.save(user);
            return {
                message: '축하합니다! 던전을 정복했습니다.',
                turn: 'ENDING',
                state: 'GAME_CLEAR',
                finalGold: user.gameData.gold,
                finalHp: user.gameData.hp
            };
        }

        // 2. 턴 증가 및 상태 결정
        user.gameData.currentTurn += 1;

        // 3. 보스전 체크 (진입 전 선택지 제공)
        if (user.gameData.currentTurn % 5 === 0) {
            user.gameData.state = GameState.SELECTING;
            const isFinal = user.gameData.currentTurn === 15;
            // 상점 이용 후 보스전으로 가도록 유도
            user.gameData.options = ['SHOP', isFinal ? 'FINAL_BATTLE' : 'BOSS_BATTLE'];

            // 기존 옵션 초기화 방지 (이미 상점 다녀온 경우 등은 고려 필요하나, 여기선 턴 진입 시점이므로 초기화가 맞음)
            // 단, leaveShop에서는 options를 그대로 유지하거나 다시 생성해줘야 함. 
            // 현재 leaveShop 구현: user.gameData.options를 반환. 
            // 따라서 턴 진입 시에만 옵션을 설정해주면 됨.

            user.gameData.nextMonsterIntent = null;
            user.gameData.canSeeIntent = false;

            await this.userService.save(user);
            return {
                message: isFinal ? '최종 결전이 다가왔습니다. 정비하시겠습니까?' : '강력한 기운이 느껴집니다. 정비하시겠습니까?',
                turn: user.gameData.currentTurn,
                options: user.gameData.options,
                state: GameState.SELECTING,
                isBossBattle: false, // 아직 전투 아님
                hp: user.gameData.hp,
                maxHp: user.gameData.maxHp,
                gold: user.gameData.gold,
                potions: user.gameData.potions
            };
        } else {
            user.gameData.state = GameState.SELECTING;
            user.gameData.options = this.generateOptions();
            user.gameData.nextMonsterIntent = null;
            user.gameData.canSeeIntent = false;

            await this.userService.save(user);
            return {
                message: `${user.gameData.currentTurn}턴 시작!`,
                turn: user.gameData.currentTurn,
                options: user.gameData.options,
                state: GameState.SELECTING,
                isBossBattle: false,
                hp: user.gameData.hp,
                maxHp: user.gameData.maxHp,
                gold: user.gameData.gold,
                potions: user.gameData.potions
            };
        }
    }

    async selectOption(userId: number, selection: string) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (user.gameData.state === GameState.GAME_OVER) {
            throw new BadRequestException('이미 사망했습니다.');
        }

        if (selection === 'BATTLE') {
            user.gameData.state = GameState.BATTLE;
            const newMonster = await this.battleService.spawnMonster(user.gameData.currentTurn);
            await this.userService.save(user);

            const canSeeIntent = user.gameData.agi >= newMonster.agi;
            const monsterIntent = canSeeIntent ? newMonster.nextAction : '?';

            return {
                message: '전투 시작!',
                monster: newMonster,
                state: 'BATTLE',
                monsterIntent,
                canSeeIntent,
                luckyCooldown: user.gameData.luckyCooldown || 0
            };
        } else if (selection === 'SHOP') {
            user.gameData.state = GameState.SHOP;
            await this.userService.save(user);
            return { message: '상점 입장', items: ['Potion', 'Sword'], state: 'SHOP' };
        } else if (selection === 'REST') {
            user.gameData.state = GameState.REST;
            await this.userService.save(user);
            return {
                message: '휴식 처소에 도착했습니다.',
                hp: user.gameData.hp, maxHp: user.gameData.maxHp, state: 'REST',
                gold: user.gameData.gold, potions: user.gameData.potions
            };
        } else if (selection === 'TREASURE') {
            user.gameData.state = GameState.TREASURE;

            // 💰 골드 보상 동적 스케일링 (30 ~ 150)
            // 턴(1~15)에 따라 처음에는 30-40, 마지막에는 최대 150까지 증가
            const turn = user.gameData.currentTurn || 1;
            const minGold = Math.min(120, 30 + (turn - 1) * 6);
            const maxGold = Math.min(150, 40 + (turn - 1) * 8);
            const rewardGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

            user.gameData.gold = (user.gameData.gold || 0) + rewardGold;
            await this.userService.save(user);
            return {
                message: '보물 발견!',
                // description: `${rewardGold}G 획득`, // 클라이언트에서 직접 로그 출력하도록 변경
                rewardGold,
                gold: user.gameData.gold,
                state: 'TREASURE'
            };
        } else if (selection === 'BOSS_BATTLE' || selection === 'FINAL_BATTLE') {
            user.gameData.state = GameState.BOSS_BATTLE;
            const boss = await this.battleService.spawnRandomBoss(user.gameData.currentTurn);

            const intent = Math.random() < 0.7 ? 'ATTACK' : 'DEFENSE';
            user.gameData.nextMonsterIntent = intent;
            user.gameData.canSeeIntent = user.gameData.agi >= boss.agi;

            await this.userService.save(user);
            return {
                message: selection === 'FINAL_BATTLE' ? '⚠️ 최종 보스 등장!' : '⚠️ 중간 보스 등장!',
                monster: boss,
                monsterIntent: intent,
                canSeeIntent: user.gameData.canSeeIntent,
                state: GameState.BOSS_BATTLE, // 클라이언트 인식용
                isBossBattle: true,
                hp: user.gameData.hp,
                maxHp: user.gameData.maxHp,
                gold: user.gameData.gold,
                potions: user.gameData.potions,
                luckyCooldown: user.gameData.luckyCooldown || 0
            };
        }
    }

    async confirmRest(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        const healAmount = 30;
        user.gameData.hp = Math.min(user.gameData.maxHp, user.gameData.hp + healAmount);
        await this.userService.save(user);

        return this.nextTurn(userId);
    }

    async leaveShop(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (user.gameData.state !== GameState.SHOP) {
            throw new BadRequestException('상점 상태가 아닙니다.');
        }

        user.gameData.state = GameState.SELECTING;
        await this.userService.save(user);

        return {
            message: '상점에서 나왔습니다.',
            turn: user.gameData.currentTurn,
            options: user.gameData.options,
            state: GameState.SELECTING,
            hp: user.gameData.hp,
            maxHp: user.gameData.maxHp,
            gold: user.gameData.gold,
            potions: user.gameData.potions
        };
    }
}
