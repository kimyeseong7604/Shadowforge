import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../services/user.service';
import { GameState } from '../entity/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async validateGoogleUser(googleUser: any) {
        console.log('Validating Google User:', googleUser.emails?.[0]?.value);
        const { id, emails, displayName, photos } = googleUser;
        const email = emails[0].value;

        // findOrCreate logic
        // We need to update userService or repo to find by googleId
        // For now, let's assume we search by googleId
        return {
            googleId: id,
            email: email,
            username: displayName,
            picture: photos[0].value,
        };
    }

    async login(user: any) {
        console.log('User logged in:', user.email);
        const payload = { username: user.username, sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
