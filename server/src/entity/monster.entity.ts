import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Monster {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    hp: number;

    @Column()
    attack: number;

    @Column()
    imagePath: string; // 이미지 경로
}