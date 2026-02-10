import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Monster {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    specId: number; // 도감 번호

    @Column()
    name: string;

    @Column()
    hp: number;

    @Column()
    maxHp: number;

    @Column()
    attack: number;

    @Column()
    defense: number;

    @Column()
    agi: number; // ✨ 민첩 (추가됨)

    @Column({ default: 'ATTACK' })
    nextAction: string; // 몬스터의 다음 행동 (ATTACK / DEFENSE)

    @Column()
    rewardGold: number;

    @Column()
    imagePath: string; // 이미지 경로
}