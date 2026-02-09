import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum GameState {
    SELECTING = 'SELECTING', // 선택지 고르는 중
    BATTLE = 'BATTLE',       // 전투 중
    SHOP = 'SHOP',           // 상점 이용 중
    EVENT = 'EVENT',         // 이벤트 중
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
    };
}