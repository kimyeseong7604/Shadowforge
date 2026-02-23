import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';
import { BattleService } from '../services/battle.service';
import { ShopService } from '../services/shop.service';
import { WEAPON_BOOK, SHOP_LIST } from '../data/items.data';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class AppController {


  constructor(
    private readonly userService: UserService,
    private readonly gameService: GameService,
    private readonly battleService: BattleService,
    private readonly shopService: ShopService,
  ) { }

  @Post('game/start')
  startGame(@Req() req: any) {
    return this.gameService.startGame(req.user.userId);
  }

  @Get('users/me')
  getMe(@Req() req: any) {
    return this.userService.getMe(req.user.userId);
  }

  @Post('game/option')
  selectOption(@Req() req: any, @Body() body: { selection: string }) {
    return this.gameService.selectOption(req.user.userId, body.selection);
  }

  @Post('game/next')
  nextTurn(@Req() req: any) {
    return this.gameService.nextTurn(req.user.userId);
  }


  @Post('game/confirm-rest')
  confirmRest(@Req() req: any) {
    return this.gameService.confirmRest(req.user.userId);
  }

  @Post('battle')
  battle(@Req() req: any, @Body() body: { monsterId: number, action: string, useLucky?: boolean }) {
    return this.battleService.battleAction(req.user.userId, body.monsterId, body.action, body.useLucky || false);
  }

  @Post('battle/reward')
  claimReward(@Req() req: any, @Body() body: { reward: 'STR' | 'AGI' | 'POTION' }) {
    return this.battleService.claimVictoryReward(req.user.userId, body.reward);
  }

  @Post('battle/escape')
  escape(@Req() req: any) {
    return this.battleService.escape(req.user.userId);
  }

  @Post('use-potion')
  usePotion(@Req() req: any) {
    return this.shopService.usePotion(req.user.userId);
  }

  @Post('equip-item')
  equipItem(@Req() req: any, @Body() body: { itemId: string }) {
    return this.shopService.equipItem(req.user.userId, body.itemId);
  }

  @Get('shop')
  getShopItems(@Req() req: any) {
    return this.shopService.getShopItems(req.user.userId);
  }

  @Post('buy-item')
  buyItem(@Req() req: any, @Body() body: { itemId: string }) {
    return this.shopService.buyItem(req.user.userId, body.itemId);
  }

  @Post('game/leave-shop')
  leaveShop(@Req() req: any) {
    return this.gameService.leaveShop(req.user.userId);
  }

  @Get('game/metadata')
  async getMetadata(@Req() req: any) {
    const uid = req.user.userId;
    let shopItems;
    try {
      const shopData = await this.shopService.getShopItems(uid);
      shopItems = shopData.items.map(item => ({
        ...item,
        title: item.name,
        price: item.price,
        type: item.type || (item.id === 'POTION' ? 'POTION' : item.id === 'HEART' ? 'HEART' : 'WEAPON'),
        effectText: item.desc || (item as any).effectText,
        value: (item as any).value
      }));
    } catch (e) {
      shopItems = SHOP_LIST;
    }

    return {
      weapons: WEAPON_BOOK,
      shopItems: shopItems,
    };
  }

}