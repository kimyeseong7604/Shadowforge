import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';
import { BattleService } from '../services/battle.service';
import { ShopService } from '../services/shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Monster } from '../entity/monster.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Monster],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User, Monster]),
    AuthModule,
  ],

  controllers: [AppController],
  providers: [
    UserService,
    GameService,
    BattleService,
    ShopService,
  ],
})
export class AppModule { }
