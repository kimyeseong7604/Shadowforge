export interface ItemSpec {
    id: string;
    name: string;
    atk: number;
    price: number; // 상점 가격
    requiredStr?: number;
}

export const WEAPON_BOOK: Record<string, ItemSpec> = {
    NO_SWORD: { id: "NO_SWORD", name: "무기 없음", atk: 0, price: 0, requiredStr: 0 },
    NORMAL_SWORD: { id: "NORMAL_SWORD", name: "노말 검", atk: 4, price: 15, requiredStr: 3 },
    SWORD: { id: "SWORD", name: "검", atk: 7, price: 40, requiredStr: 7 },
    RARE_SWORD: { id: "RARE_SWORD", name: "레어 검", atk: 12, price: 90, requiredStr: 12 },
    EPIC_SWORD: { id: "EPIC_SWORD", name: "에픽 검", atk: 20, price: 200, requiredStr: 20 },
    UNIQUE_SWORD: { id: "UNIQUE_SWORD", name: "유니크 검", atk: 35, price: 400, requiredStr: 30 },
    LEGENDARY_SWORD: { id: "LEGENDARY_SWORD", name: "레전더리 검", atk: 55, price: 750, requiredStr: 40 },
};

export const SHOP_LIST = [
    { type: 'POTION', id: 'POTION', name: '포션', price: 10, desc: 'HP +20', value: 20 },
    { type: 'HEART', id: 'HEART', name: '생명의 정수', price: 50, desc: '최대 HP +20', value: 20 },
    { type: 'WEAPON', ...WEAPON_BOOK.NORMAL_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.RARE_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.EPIC_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.UNIQUE_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.LEGENDARY_SWORD },
];
