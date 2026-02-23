import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { GoogleStrategy } from '../strategies/google.strategy';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { AuthController } from '../controllers/auth.controller';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';
import { BattleService } from '../services/battle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Monster } from '../entity/monster.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Monster]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'shadowforge_secret_key',
                signOptions: { expiresIn: '7d' as any },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        AuthService,
        GoogleStrategy,
        JwtStrategy,
        UserService,
        GameService,
        BattleService
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
