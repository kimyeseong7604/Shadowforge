import { create } from "zustand";
import { api } from "../shared/api/endpoints";
import type { GameData, WeaponId, ShopItemId, InventoryItem, Monster } from "../shared/api/types";

// ✅ UI 표시용 정적 데이터 (Fallback 용도 - 서버 연결 실패 시 사용)
const FALLBACK_WEAPONS: Record<string, InventoryItem> = {
  NO_SWORD: { id: "NO_SWORD" as WeaponId, name: "무기 없음", atk: 0, img: "/gadgets/검.png" },
  NORMAL_SWORD: { id: "NORMAL_SWORD" as WeaponId, name: "노말 검", atk: 2, img: "/gadgets/노말검.png" },
  SWORD: { id: "SWORD" as WeaponId, name: "검", atk: 3, img: "/gadgets/검.png" },
  RARE_SWORD: { id: "RARE_SWORD" as WeaponId, name: "레어 검", atk: 5, img: "/gadgets/레어검.png" },
  EPIC_SWORD: { id: "EPIC_SWORD" as WeaponId, name: "에픽 검", atk: 8, img: "/gadgets/에픽검.png" },
  UNIQUE_SWORD: { id: "UNIQUE_SWORD" as WeaponId, name: "유니크 검", atk: 12, img: "/gadgets/유니크검.png" },
  LEGENDARY_SWORD: { id: "LEGENDARY_SWORD" as WeaponId, name: "레전더리 검", atk: 16, img: "/gadgets/레전더리검.png" },
};


export interface ShopItem {
  id: ShopItemId;
  title: string;
  img: string;
  cost: number;
  type: string;
  effectText: string;
  weaponId?: string;
  potionCount?: number;
}

interface GameStore {
  gameData: GameData | null;
  userId: number | null;
  isLoading: boolean;
  isMetadataLoading: boolean;
  metadataError: string | null;
  error: string | null;
  logs: string[];
  isLogOpen: boolean;

  // 동적 메타데이터
  weapons: Record<string, InventoryItem>;
  shopItems: ShopItem[];

  currentMonster: Monster | null;
  nextMonsterIntent: string | null;
  canSeeIntent: boolean;
  rewardGold: number | null;

  // Actions
  initialize: () => void;
  fetchMetadata: (userId?: number) => Promise<void>;
  setGameData: (data: GameData) => void;
  setUserId: (id: number) => void;

  // API Calls
  startGame: (userId: number) => Promise<void>;
  selectOption: (userId: number, selection: string) => Promise<any>;
  nextTurn: (userId: number) => Promise<any>;
  battle: (userId: number, monsterId: number, action: string, useLucky: boolean) => Promise<any>;
  claimReward: (userId: number, reward: 'STR' | 'AGI' | 'POTION') => Promise<any>;
  usePotion: (userId: number) => Promise<void>;
  equipItem: (userId: number, itemId: string) => Promise<void>;
  buyItem: (userId: number, itemId: string) => Promise<any>;
  escapeBattle: (userId: number) => Promise<void>;
  confirmRest: (userId: number) => Promise<void>;
  leaveShop: (userId: number) => Promise<void>;

  pushLog: (message: string | string[]) => void;
  toggleLog: () => void;
  clearLogs: () => void;

  // Helpers & Aliases
  getEquippedWeapon: () => InventoryItem | null;
  equipWeapon: (userId: number, itemId: string) => Promise<void>;
}

// 헬퍼: 서버 응답 객체로부터 상태를 일괄 업데이트
const updateStateFromResponse = (set: any, get: any, res: any) => {
  const current = get().gameData;
  if (!current) return;

  set({
    gameData: {
      ...current,
      state: res.state || current.state,
      currentTurn: (res.turn && res.turn !== 'ENDING') ? res.turn : current.currentTurn,
      options: res.options || current.options,
      hp: res.hp !== undefined ? res.hp : (res.userHp !== undefined ? res.userHp : current.hp),
      maxHp: res.maxHp !== undefined ? res.maxHp : current.maxHp,
      gold: res.gold !== undefined ? res.gold : current.gold,
      potions: res.potions !== undefined ? res.potions : current.potions,
      inventory: res.inventory !== undefined ? res.inventory : current.inventory,
      equippedWeapon: res.equippedWeapon !== undefined ? res.equippedWeapon : current.equippedWeapon,
      luckyCooldown: res.luckyCooldown !== undefined ? res.luckyCooldown : current.luckyCooldown,
      str: res.str !== undefined ? res.str : current.str,
      agi: res.agi !== undefined ? res.agi : current.agi,
      potionPurchaseCount: res.potionPurchaseCount !== undefined ? res.potionPurchaseCount : current.potionPurchaseCount,
    },
    currentMonster: res.monster !== undefined ? res.monster : (res.monsterHp !== undefined ? { ...get().currentMonster, hp: res.monsterHp } : get().currentMonster),
    nextMonsterIntent: res.nextMonsterIntent !== undefined ? res.nextMonsterIntent : (res.monsterIntent !== undefined ? res.monsterIntent : get().nextMonsterIntent),
    canSeeIntent: res.canSeeIntent !== undefined ? res.canSeeIntent : get().canSeeIntent,
    rewardGold: res.rewardGold !== undefined ? res.rewardGold : get().rewardGold,
  });

  if (res.message) get().pushLog(res.message);
  if (res.description) get().pushLog(res.description);
  if (res.logs && res.logs.length > 0) get().pushLog(res.logs);
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameData: null,
  userId: null,
  isLoading: false,
  isMetadataLoading: false,
  metadataError: null,
  error: null,
  logs: [],
  isLogOpen: true,

  weapons: FALLBACK_WEAPONS,
  shopItems: [],

  currentMonster: null,
  nextMonsterIntent: null,
  canSeeIntent: false,
  rewardGold: null,

  initialize: () => {
    get().fetchMetadata();
  },

  fetchMetadata: async (userId?: number) => {
    const uid = userId || get().userId;
    if (get().isMetadataLoading) return;
    set({ isMetadataLoading: true, metadataError: null });
    try {
      const data = await api.getMetadata(uid || undefined);

      const newWeapons: Record<string, InventoryItem> = {};
      Object.keys(data.weapons).forEach(key => {
        const spec = data.weapons[key];
        newWeapons[key] = {
          id: spec.id as WeaponId,
          name: spec.name,
          atk: spec.atk,
          img: FALLBACK_WEAPONS[key]?.img || "/gadgets/검.png"
        };
      });

      const newShopItems: ShopItem[] = data.shopItems.map((item: any) => ({
        id: item.id as ShopItemId,
        title: item.name || item.title,
        img: FALLBACK_WEAPONS[item.id]?.img || (item.type === 'POTION' ? "/gadgets/포션.png" : "/gadgets/검.png"),
        cost: item.price ?? item.cost ?? 0,
        effectText: item.desc || item.effectText || `ATK +${item.atk}`,
        type: item.type, // 서버에서 넘겨주는 타입 저장
        weaponId: (item.type === 'WEAPON' || !item.type) && item.id !== 'POTION' ? item.id : undefined,
        potionCount: item.type === 'POTION' ? 1 : undefined
      }));

      set({ weapons: newWeapons, shopItems: newShopItems, isMetadataLoading: false });
    } catch (e: any) {
      console.error("Failed to fetch metadata", e);
      set({ metadataError: "서버 데이터를 가져오지 못했습니다. 기본 설정을 사용합니다.", isMetadataLoading: false });
    }
  },

  setGameData: (data: GameData) => set({ gameData: data }),
  setUserId: (id: number) => set({ userId: id }),

  startGame: async (userId: number) => {
    set({ isLoading: true, error: null, logs: [] });
    try {
      const res = await api.startGame(userId);
      set({
        gameData: {
          currentTurn: res.turn,
          state: res.state,
          options: res.options,
          hp: 100, maxHp: 100, str: 10, agi: 10,
          gold: 0, potions: 0, stunned: false, luckyCooldown: 0,
          inventory: ['NO_SWORD'],
          equippedWeapon: 'NO_SWORD',
          potionPurchaseCount: 0,
        },
        userId
      });
      get().pushLog("게임을 시작합니다.");
    } catch (e: any) {
      set({ error: "게임 시작 실패" });
    } finally {
      set({ isLoading: false });
    }
  },

  selectOption: async (userId: number, selection: string) => {
    set({ isLoading: true });
    try {
      const res = await api.selectOption(userId, selection);
      updateStateFromResponse(set, get, res);
      return res;
    } catch (e) {
      set({ error: "옵션 선택 실패" });
    } finally {
      set({ isLoading: false });
    }
  },

  nextTurn: async (userId: number) => {
    set({ isLoading: true });
    try {
      const res = await api.nextTurn(userId);
      updateStateFromResponse(set, get, res);
      return res;
    } catch (e) {
      set({ error: "다음 턴 이동 실패" });
    } finally {
      set({ isLoading: false });
    }
  },

  battle: async (userId: number, monsterId: number, action: string, useLucky: boolean) => {
    set({ isLoading: true });
    try {
      const res = await api.battle(userId, monsterId, action, useLucky);
      updateStateFromResponse(set, get, res);
      return res;
    } catch (e) {
      set({ error: "전투 수행 실패" });
    } finally {
      set({ isLoading: false });
    }
  },

  claimReward: async (userId: number, reward: 'STR' | 'AGI' | 'POTION') => {
    set({ isLoading: true });
    try {
      const res = await api.claimReward(userId, reward);
      updateStateFromResponse(set, get, res);
      return res;
    } catch (e) {
      set({ error: "보상 획득 실패" });
    } finally {
      set({ isLoading: false });
    }
  },

  usePotion: async (userId: number) => {
    try {
      const res = await api.usePotion(userId);
      updateStateFromResponse(set, get, res);
    } catch (e) {
      set({ error: "포션 사용 실패" });
    }
  },

  equipItem: async (userId: number, itemId: string) => {
    try {
      const res = await api.equipItem(userId, itemId);
      updateStateFromResponse(set, get, res);
    } catch (e) {
      set({ error: "아이템 장착 실패" });
    }
  },

  buyItem: async (userId: number, itemId: string) => {
    try {
      const res = await api.buyItem(userId, itemId);
      updateStateFromResponse(set, get, res);
      // 🔥 메타데이터(가격) 자동 갱신
      await get().fetchMetadata();
      return res;
    } catch (e) {
      set({ error: "아이템 구매 실패" });
    }
  },

  escapeBattle: async (userId: number) => {
    try {
      const res = await api.escapeBattle(userId);
      updateStateFromResponse(set, get, res);
    } catch (e) {
      set({ error: "도망 실패" });
    }
  },

  confirmRest: async (userId: number) => {
    try {
      const res = await api.confirmRest(userId);
      updateStateFromResponse(set, get, res);
    } catch (e) {
      set({ error: "휴식 실패" });
    }
  },

  leaveShop: async (userId: number) => {
    set({ isLoading: true });
    try {
      const res = await api.leaveShop(userId);
      updateStateFromResponse(set, get, res);
    } catch (e) {
      set({ error: "상점 퇴장 실패" });
    } finally {
      set({ isLoading: false });
    }
  },

  pushLog: (message: string | string[]) => {
    set((state) => {
      const newLogs = Array.isArray(message) ? [...state.logs, ...message] : [...state.logs, message];
      return { logs: newLogs.slice(-50) };
    });
  },

  toggleLog: () => set((state) => ({ isLogOpen: !state.isLogOpen })),
  clearLogs: () => set({ logs: [] }),

  getEquippedWeapon: () => {
    const weaponId = get().gameData?.equippedWeapon;
    if (!weaponId) return get().weapons['NO_SWORD'] || FALLBACK_WEAPONS['NO_SWORD'];
    return get().weapons[weaponId] || get().weapons['NO_SWORD'] || FALLBACK_WEAPONS['NO_SWORD'];
  },

  // 호환성용 별칭
  equipWeapon: async (userId: number, itemId: string) => get().equipItem(userId, itemId),
}));
