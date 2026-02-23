import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, GameState } from '../entity/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
    ) { }

    async findOne(userId: number) {
        return await this.userRepo.findOne({ where: { id: userId } });
    }

    async findByGoogleId(googleId: string) {
        return await this.userRepo.findOne({ where: { googleId } });
    }

    async save(user: User) {
        return await this.userRepo.save(user);
    }

    async getMe(userId: number) {
        const user = await this.findOne(userId);
        return user || null;
    }

    async createFromGoogle(profile: any) {
        const user = this.userRepo.create({
            googleId: profile.googleId,
            email: profile.email,
            username: profile.username,
            picture: profile.picture,
            gameData: null,
        });
        return await this.save(user);
    }

    async findOrCreateUser(userId: number) {
        let user = await this.findOne(userId);
        if (!user) {
            user = this.userRepo.create({
                id: userId,
                username: `Player${userId}`,
                gameData: null,
            });
            await this.save(user);
        }
        return user;
    }
}

