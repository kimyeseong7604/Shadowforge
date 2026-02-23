// src/game/monsters.data.ts

export enum MonsterGrade {
    NORMAL = 'NORMAL',
    ELITE = 'ELITE', // 엘리트는 보스는 아니지만 강한 잡몹
    BOSS = 'BOSS',
}

export interface MonsterSpec {
    id: number;
    name: string;
    grade: MonsterGrade;
    minTurn: number;     // 등장 시작 턴
    baseHp: number;      // 기본 체력
    baseAtk: number;     // 기본 공격력
    def: number;         // 방어력
    baseAgi: number;     // ✨ 기본 민첩 (추가됨)
    exp: number;         // 경험치 (추후 레벨업 시스템용)
    gold: number;        // 드랍 골드
    image: string;       // 이미지 경로
}

export const MONSTER_BOOK: MonsterSpec[] = [
    // =======================================================
    // 🌱 초반 (1~4 턴) - 몸풀기용
    // =======================================================
    {
        id: 1, name: '코볼트', grade: MonsterGrade.NORMAL, minTurn: 1,
        baseHp: 30, baseAtk: 5, def: 0, baseAgi: 5, exp: 5, gold: 10,
        image: 'kobold.png'
    },
    {
        id: 2, name: '임프', grade: MonsterGrade.NORMAL, minTurn: 1,
        baseHp: 35, baseAtk: 6, def: 0, baseAgi: 8, exp: 6, gold: 12,
        image: 'imp.png'
    },
    {
        id: 3, name: '고블린', grade: MonsterGrade.NORMAL, minTurn: 2,
        baseHp: 50, baseAtk: 6, def: 1, baseAgi: 6, exp: 8, gold: 15,
        image: 'goblin.png'
    },
    {
        id: 4, name: '거미', grade: MonsterGrade.NORMAL, minTurn: 3,
        baseHp: 45, baseAtk: 8, def: 0, baseAgi: 7, exp: 10, gold: 20,
        image: 'spider.png'
    },

    // =======================================================
    // 🌿 중반 (6~9 턴) - 첫 보스 이후, 조금 더 단단해짐
    // =======================================================
    {
        id: 5, name: '미믹', grade: MonsterGrade.NORMAL, minTurn: 6,
        baseHp: 90, baseAtk: 8, def: 2, baseAgi: 5, exp: 12, gold: 40,
        image: 'mimic.png'
    },
    {
        id: 6, name: '스켈레톤', grade: MonsterGrade.NORMAL, minTurn: 6,
        baseHp: 70, baseAtk: 14, def: 2, baseAgi: 10, exp: 15, gold: 30,
        image: 'skeleton.png'
    },
    {
        id: 7, name: '스카라베', grade: MonsterGrade.NORMAL, minTurn: 7,
        baseHp: 60, baseAtk: 10, def: 6, baseAgi: 4, exp: 18, gold: 35,
        image: 'scarab.png'
    },

    // =======================================================
    // 🔥 후반 (11~14 턴) - 엘리트급 몬스터
    // =======================================================
    {
        id: 9, name: '도끼병사', grade: MonsterGrade.ELITE, minTurn: 11,
        baseHp: 110, baseAtk: 18, def: 3, baseAgi: 7, exp: 25, gold: 50,
        image: 'axe_soldier.png'
    },
    {
        id: 10, name: '헬하운드', grade: MonsterGrade.ELITE, minTurn: 11,
        baseHp: 130, baseAtk: 22, def: 2, baseAgi: 15, exp: 30, gold: 60,
        image: 'hellhound.png'
    },
    {
        id: 11, name: '야수 전사', grade: MonsterGrade.ELITE, minTurn: 13,
        baseHp: 160, baseAtk: 20, def: 4, baseAgi: 12, exp: 35, gold: 80,
        image: 'beast_warrior.png'
    },

    // =======================================================
    // 💀 극후반 (16~ 턴) - 사실상 중간보스급
    // =======================================================
    {
        id: 12, name: '스톤골램', grade: MonsterGrade.ELITE, minTurn: 16,
        baseHp: 250, baseAtk: 15, def: 12, baseAgi: 1, exp: 45, gold: 100,
        image: 'stone_golem.png'
    },
    {
        id: 13, name: '강철병사', grade: MonsterGrade.ELITE, minTurn: 16,
        baseHp: 180, baseAtk: 25, def: 8, baseAgi: 10, exp: 50, gold: 120,
        image: 'steel_soldier.png'
    },

    // =======================================================
    // 👑 LORDS (군주들) - 5, 10, 15, 20턴마다 랜덤 등장
    // =======================================================
    {
        id: 101, name: '부패의 군주', grade: MonsterGrade.BOSS, minTurn: 5,
        baseHp: 96, baseAtk: 10, def: 3, baseAgi: 5, exp: 100, gold: 200,
        image: 'lord_rot.png'
    },
    {
        id: 102, name: '백골의 군주', grade: MonsterGrade.BOSS, minTurn: 5,
        baseHp: 88, baseAtk: 12, def: 5, baseAgi: 18, exp: 120, gold: 250,
        image: 'lord_bone.png'
    },
    {
        id: 103, name: '대지의 군주', grade: MonsterGrade.BOSS, minTurn: 5,
        baseHp: 160, baseAtk: 8, def: 15, baseAgi: 2, exp: 150, gold: 300,
        image: 'lord_earth.png'
    },
    {
        id: 104, name: '어둠의 군주', grade: MonsterGrade.BOSS, minTurn: 5,
        baseHp: 120, baseAtk: 13, def: 8, baseAgi: 15, exp: 200, gold: 400,
        image: 'lord_dark.png'
    },
    {
        id: 105, name: '죽음의 군주', grade: MonsterGrade.BOSS, minTurn: 5,
        baseHp: 144, baseAtk: 15, def: 10, baseAgi: 20, exp: 300, gold: 500,
        image: 'lord_death.png'
    }
];
