// src/app.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, GameState } from '../entity/user.entity'; // 경로 확인

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) { }

  // 🎲 랜덤 선택지 3개 만드는 함수 (도우미)
  private generateOptions() {
    const types = ['BATTLE', 'SHOP', 'REST', 'EVENT'];
    // 랜덤으로 3개 뽑기 (중복 허용 or 불허는 기획에 따라)
    return [types[0], types[1], types[0]]; // 예시: 전투, 상점, 전투
  }

  // 1. 게임 시작 (로비 -> 1턴 시작)
  async startGame(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 초기화
    user.gameData = {
      currentTurn: 1,
      state: GameState.SELECTING, // 선택지 고르는 상태로 시작
      options: this.generateOptions(), // 선택지 3개 생성
      hp: 100,
      maxHp: 100,
      str: 10,
    };

    await this.userRepo.save(user);

    return {
      message: '1턴 시작! 선택지를 고르세요.',
      turn: 1,
      options: user.gameData.options // 프론트는 이걸 받아서 카드 3장을 띄움
    };
  }

  // 2. 선택지 선택 (유저가 '전투' 클릭 시)
  async selectOption(userId: number, selection: string) { // selection: 'BATTLE' 등
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (selection === 'BATTLE') {
      user.gameData.state = GameState.BATTLE;
      // 여기서 몬스터 생성 로직 호출!
      await this.userRepo.save(user);
      return { message: '전투 시작!', monster: { name: 'Slime', hp: 50 } };
    }
    else if (selection === 'SHOP') {
      user.gameData.state = GameState.SHOP;
      await this.userRepo.save(user);
      return { message: '상점 입장', items: ['Potion', 'Sword'] };
    }
  }

  // 3. 턴 완료 (전투 승리 or 상점 이용 끝 -> 다음 턴으로)
  async nextTurn(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 턴 증가!
    user.gameData.currentTurn += 1;
    // 상태 초기화
    user.gameData.state = GameState.SELECTING;
    // 새 선택지 생성
    user.gameData.options = this.generateOptions();

    await this.userRepo.save(user);

    return {
      message: `${user.gameData.currentTurn}턴 시작!`,
      turn: user.gameData.currentTurn, // 프론트는 이걸로 상단 동그라미 갱신
      options: user.gameData.options
    };
  }
}