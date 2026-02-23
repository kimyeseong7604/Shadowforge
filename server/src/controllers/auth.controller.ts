import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private gameService: GameService,
        private configService: ConfigService,
    ) { }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req: Request) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
        const googleUser = req.user as any;

        // Find or create user
        let user = await this.userService.findByGoogleId(googleUser.googleId);
        if (!user) {
            user = await this.userService.createFromGoogle(googleUser);
        }


        const { access_token } = await this.authService.login(user);

        const frontendUrl = this.configService.get('FRONTEND_URL');
        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/login?token=${access_token}`);
    }
}
