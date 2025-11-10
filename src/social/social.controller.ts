import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SocialShareService } from './social-share.service';
import { ConnectSocialAccountDto } from './dto/connect-social-account.dto';

@ApiTags('Social Media')
@Controller('api/social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SocialController {
  constructor(private socialShareService: SocialShareService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Obtenir mes comptes sociaux connectés' })
  async getUserSocialAccounts(@Req() req) {
    return await this.socialShareService.getUserSocialAccounts(req.user.id);
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connecter un compte de réseau social' })
  async connectSocialAccount(
    @Req() req,
    @Body() connectDto: ConnectSocialAccountDto,
  ) {
    return await this.socialShareService.connectSocialAccount(
      req.user.id,
      connectDto.platform,
      connectDto.accessToken,
      connectDto.refreshToken,
      connectDto.expiresIn,
      connectDto.platformUserId,
      connectDto.platformUsername,
    );
  }

  @Delete('disconnect/:platform')
  @ApiOperation({ summary: 'Déconnecter un compte de réseau social' })
  @ApiParam({ name: 'platform', description: 'facebook, twitter, linkedin' })
  async disconnectSocialAccount(@Req() req, @Param('platform') platform: string) {
    await this.socialShareService.disconnectSocialAccount(
      req.user.id,
      platform as any,
    );
    return { message: 'Compte déconnecté avec succès' };
  }

  // ✅ Endpoints OAuth callback (pour connexion via OAuth)
  @Get('auth/facebook/callback')
  @ApiOperation({ summary: 'Callback OAuth Facebook' })
  async facebookCallback(@Query('code') code: string, @Req() req) {
    // Implémenter l'échange du code contre un access token
    // Ceci nécessite l'utilisation de passport-facebook ou similar
    return { message: 'Facebook OAuth callback', code };
  }

  @Get('auth/twitter/callback')
  @ApiOperation({ summary: 'Callback OAuth Twitter' })
  async twitterCallback(@Query('oauth_token') token: string, @Query('oauth_verifier') verifier: string) {
    return { message: 'Twitter OAuth callback', token, verifier };
  }

  @Get('auth/linkedin/callback')
  @ApiOperation({ summary: 'Callback OAuth LinkedIn' })
  async linkedinCallback(@Query('code') code: string) {
    return { message: 'LinkedIn OAuth callback', code };
  }
}
