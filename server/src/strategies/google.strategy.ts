import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

        if (!clientID || !clientSecret || !callbackURL) {
            console.error('❌ [Auth] Google OAuth environment variables are missing!');
            console.error('Check if .env file exists in the /server folder and contains GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL.');
        }

        super({
            clientID: clientID || 'missing',
            clientSecret: clientSecret || 'missing',
            callbackURL: callbackURL || 'missing',
            scope: ['email', 'profile'],
        });
    }

    authorizationParams(): { [key: string]: string } {
        return {
            prompt: 'select_account',
            access_type: 'offline',
        };
    }


    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const user = await this.authService.validateGoogleUser(profile);
        done(null, user);
    }
}
