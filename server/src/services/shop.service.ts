import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameState } from '../entity/user.entity';
import { WEAPON_BOOK } from '../data/items.data';
import { UserService } from './user.service';

@Injectable()
export class ShopService {
    constructor(
        private readonly userService: UserService,
    ) { }

    async usePotion(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (!user.gameData.potions || user.gameData.potions <= 0) {
            throw new BadRequestException('보유한 포션이 없습니다.');
        }

        if (user.gameData.hp >= user.gameData.maxHp) {
            throw new BadRequestException('이미 체력이 가득 찼습니다.');
        }

        user.gameData.potions -= 1;
        user.gameData.hp = Math.min(user.gameData.maxHp, user.gameData.hp + 20);
        await this.userService.save(user);

        return {
            message: '포션을 사용하여 체력을 20 회복했습니다.',
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

        if (!WEAPON_BOOK[itemId]) {
            throw new BadRequestException('존재하지 않는 무기입니다.');
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
            // 🧪 포션: 살 때마다 가격이 20%씩 상승 (최소 10G)
            const count = user.gameData.potionPurchaseCount || 0;
            itemPrice = Math.floor(10 * Math.pow(1.2, count));
            itemName = '포션';
            isPotion = true;
        } else if (itemId === 'HEART') {
            // ❤️ 생명의 정수: 살 때마다 가격이 1.5배씩 상승 (소수점 버림)
            const count = user.gameData.maxHpBonusCount || 0;
            itemPrice = Math.floor(50 * Math.pow(1.5, count));
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
            user.gameData.maxHp += 20;
            user.gameData.hp += 20;
            user.gameData.maxHpBonusCount = (user.gameData.maxHpBonusCount || 0) + 1;
        } else {
            user.gameData.inventory.push(itemId);
        }

        await this.userService.save(user);

        return {
            message: `${itemName} 구매 완료!`,
            gold: user.gameData.gold,
            potions: user.gameData.potions,
            inventory: user.gameData.inventory
        };
    }
}
