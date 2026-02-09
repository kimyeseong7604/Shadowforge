import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../services/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('start')
  startGame(@Body() body: { userId: number }) {
    return this.appService.startGame(body.userId);
  }

  @Post('select')
  selectOption(@Body() body: { userId: number, selection: string }) {
    return this.appService.selectOption(body.userId, body.selection);
  }

  @Post('next-turn')
  nextTurn(@Body() body: { userId: number }) {
    return this.appService.nextTurn(body.userId);
  }
}