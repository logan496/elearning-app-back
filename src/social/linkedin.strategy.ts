import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('LINKEDIN_CLIENT_ID') || '',
      clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET') || '',
      callbackURL: `${configService.get('APP_URL')}/api/social/auth/linkedin/callback`,
      scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const user = {
      platformUserId: profile.id,
      platformUsername: profile.displayName,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
