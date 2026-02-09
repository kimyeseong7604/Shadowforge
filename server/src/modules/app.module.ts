import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Monster } from '../entity/monster.entity';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mariadb',      // 'mysql'이라고 써도 되지만, 명확하게 'mariadb' 추천
    host: 'localhost',    // 내 컴퓨터에 켜져 있으니까 localhost
    port: 3306,           // 알려주신 포트 번호
    username: 'root',     // 알려주신 아이디
    password: 'root',     // 알려주신 비밀번호
    database: 'game_db',  // ⚠️ 중요: 사용할 데이터베이스 이름 (아래 설명 참고)
    entities: [User],     // 사용할 테이블(엔티티) 목록
    synchronize: true,    // 개발 중에는 true (자동으로 테이블 생성)
  }),
  TypeOrmModule.forFeature([User, Monster]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
