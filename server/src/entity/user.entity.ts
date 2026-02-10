import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum GameState {
    SELECTING = 'SELECTING',
    BATTLE = 'BATTLE',
    BOSS_BATTLE = 'BOSS_BATTLE',
    SHOP = 'SHOP',
    REST = 'REST',
    TREASURE = 'TREASURE',
    GAME_CLEAR = 'GAME_CLEAR',
    GAME_OVER = 'GAME_OVER',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    // JSON으로 유연하게 스탯 저장
    @Column({ type: 'json' })
    gameData: {
        currentTurn: number;     // 현재 턴 (1, 2, 3...)
        state: GameState;        // 현재 상태 (전투중? 선택중?)
        options: string[];       // 현재 뜬 선택지 3개 (예: ['battle', 'shop', 'rest'])
        hp: number;
        maxHp: number;
        str: number;
        agi: number;
        stunned: boolean; // ✨ 기절 상태 (추가됨)
        luckyCooldown: number; // 🍀 럭키 어택 쿨타임 (0일 때 사용 가능)
        gold: number;
    };
}