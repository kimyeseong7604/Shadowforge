import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameState } from '../entity/user.entity';
import { WEAPON_BOOK, SHOP_LIST } from '../data/items.data';
import { UserService } from './user.service';

@Injectable()
export class ShopService {
    constructor(
        private readonly userService: UserService,
    ) { }

    async getShopItems(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        const heartCount = user.gameData.maxHpBonusCount || 0;

        // SHOP_LIST를 기반으로 동적 가격 계산 (포션 10G 고정, 생명의 정수 1.5배)
        const items = SHOP_LIST.map(item => {
            let price = item.price;
            if (item.id === 'POTION') price = 10;
            if (item.id === 'HEART') price = Math.floor(50 * Math.pow(1.5, heartCount));

            return {
                ...item,
                price
            };
        });

        return { items };
    }

    async usePotion(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (!user.gameData.potions || user.gameData.potions <= 0) {
            throw new BadRequestException('보유한 포션이 없습니다.');
        }

        if (user.gameData.hp >= user.gameData.maxHp) {
            throw new BadRequestException('이미 체력이 가득 찼습니다.');
        }

        const potionItem = SHOP_LIST.find(i => i.id === 'POTION');
        const healAmount = (potionItem as any)?.value || 20;

        user.gameData.potions -= 1;
        user.gameData.hp = Math.min(user.gameData.maxHp, user.gameData.hp + healAmount);
        await this.userService.save(user);

        return {
            message: `포션을 사용하여 체력을 ${healAmount} 회복했습니다.`,
            hp: user.gameData.hp,
            potions: user.gameData.potions
        };
    }

    async equipItem(userId: number, itemId: string) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (!user.gameData.inventory.includes(itemId)) {
            throw new BadRequestException('인벤토리에 없는 아이템입니다.');
        }

        const weapon = WEAPON_BOOK[itemId];
        if (!weapon) {
            throw new BadRequestException('존재하지 않는 무기입니다.');
        }

        const requiredStr = weapon.requiredStr || 0;
        if (user.gameData.str < requiredStr) {
            throw new BadRequestException(`이 무기를 장착하려면 힘(STR)이 ${requiredStr} 이상이어야 합니다. (현재: ${user.gameData.str})`);
        }

        user.gameData.equippedWeapon = itemId;
        await this.userService.save(user);

        return {
            message: `${WEAPON_BOOK[itemId].name}을(를) 장착했습니다.`,
            equippedWeapon: itemId
        };
    }

    async buyItem(userId: number, itemId: string) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (user.gameData.state !== GameState.SHOP) {
            throw new BadRequestException('상점이 아닙니다.');
        }

        let itemPrice = 0;
        let itemName = '';
        let isPotion = false;

        if (itemId === 'POTION') {
            itemPrice = 10;
            itemName = '포션';
            isPotion = true;
        } else if (itemId === 'HEART') {
            const heartCount = user.gameData.maxHpBonusCount || 0;
            itemPrice = Math.floor(50 * Math.pow(1.5, heartCount));
            itemName = '생명의 정수';
        } else if (WEAPON_BOOK[itemId]) {
            itemPrice = WEAPON_BOOK[itemId].price;
            itemName = WEAPON_BOOK[itemId].name;
        } else {
            throw new BadRequestException('존재하지 않는 아이템입니다.');
        }

        if (user.gameData.gold < itemPrice) {
            throw new BadRequestException(`골드가 부족합니다. (필요: ${itemPrice}G)`);
        }

        if (!isPotion && itemId !== 'HEART' && user.gameData.inventory.includes(itemId)) {
            throw new BadRequestException('이미 보유한 아이템입니다.');
        }

        user.gameData.gold -= itemPrice;
        if (isPotion) {
            user.gameData.potions = (user.gameData.potions || 0) + 1;
            user.gameData.potionPurchaseCount = (user.gameData.potionPurchaseCount || 0) + 1;
        } else if (itemId === 'HEART') {
            const heartItem = SHOP_LIST.find(i => i.id === 'HEART');
            const hpBonus = (heartItem as any)?.value || 20;
            user.gameData.maxHp += hpBonus;
            user.gameData.hp += hpBonus;
            user.gameData.maxHpBonusCount = (user.gameData.maxHpBonusCount || 0) + 1;
        } else {
            // 무기 구매 시
            if (!user.gameData.inventory.includes(itemId)) {
                user.gameData.inventory.push(itemId);
            }
        }

        await this.userService.save(user);

        return {
            message: `${itemName} 구매 완료!`,
            gold: user.gameData.gold,
            potions: user.gameData.potions,
            inventory: user.gameData.inventory,
            hp: user.gameData.hp,
            maxHp: user.gameData.maxHp,
        };
    }
}
