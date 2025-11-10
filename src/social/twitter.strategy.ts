import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(private configService: ConfigService) {
    super({
      consumerKey: configService.get<string>('TWITTER_CONSUMER_KEY') || '',
      consumerSecret: configService.get<string>('TWITTER_CONSUMER_SECRET') || '',
      callbackURL: `${configService.get('APP_URL')}/api/social/auth/twitter/callback`,
      includeEmail: true,
    });
  }

  async validate(
    token: string,
    tokenSecret: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const user = {
      platformUserId: profile.id,
      platformUsername: profile.username,
      accessToken: token,
      refreshToken: tokenSecret,
    };
    done(null, user);
  }
}