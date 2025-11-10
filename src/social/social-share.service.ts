import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SocialAccount,
  SocialPlatform,
} from '../entities/social-account.entity';
import { Podcast } from '../entities/podcast.entity';
import axios from 'axios';

@Injectable()
export class SocialShareService {
  private readonly logger = new Logger(SocialShareService.name);

  constructor(
    @InjectRepository(SocialAccount)
    private socialAccountRepository: Repository<SocialAccount>,
    private configService: ConfigService,
  ) {}

  async shareOnFacebook(userId: number, podcast: Podcast): Promise<any> {
    try {
      const account = await this.socialAccountRepository.findOne({
        where: {
          userId,
          platform: SocialPlatform.FACEBOOK,
          isActive: true,
        },
      });

      if (!account) {
        this.logger.warn(`No active Facebook account for user ${userId}`);
        return { success: false, error: 'No Facebook account connected' };
      }

      // Vérifier si le token est expiré
      if (account.expiresAt && account.expiresAt < new Date()) {
        return { success: false, error: 'Facebook token expired' };
      }

      const message = this.formatPodcastMessage(podcast);
      const link = `${this.configService.get('APP_URL')}/podcasts/${podcast.id}`;

      // API Facebook Graph
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/me/feed`,
        {
          message,
          link,
          access_token: account.accessToken,
        },
      );

      this.logger.log(
        `Podcast ${podcast.id} shared on Facebook: ${response.data.id}`,
      );

      return {
        success: true,
        postId: response.data.id,
        sharedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to share on Facebook: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async shareOnTwitter(userId: number, podcast: Podcast): Promise<any> {
    try {
      const account = await this.socialAccountRepository.findOne({
        where: {
          userId,
          platform: SocialPlatform.TWITTER,
          isActive: true,
        },
      });

      if (!account) {
        this.logger.warn(`No active Twitter account for user ${userId}`);
        return { success: false, error: 'No Twitter account connected' };
      }

      const message = this.formatPodcastMessage(podcast, 280); // Limite Twitter
      const link = `${this.configService.get('APP_URL')}/podcasts/${podcast.id}`;

      // Twitter API v2
      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        {
          text: `${message}\n${link}`,
        },
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `Podcast ${podcast.id} shared on Twitter: ${response.data.data.id}`,
      );

      return {
        success: true,
        tweetId: response.data.data.id,
        sharedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to share on Twitter: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async shareOnLinkedIn(userId: number, podcast: Podcast): Promise<any> {
    try {
      const account = await this.socialAccountRepository.findOne({
        where: {
          userId,
          platform: SocialPlatform.LINKEDIN,
          isActive: true,
        },
      });

      if (!account) {
        this.logger.warn(`No active LinkedIn account for user ${userId}`);
        return { success: false, error: 'No LinkedIn account connected' };
      }

      const message = this.formatPodcastMessage(podcast);
      const link = `${this.configService.get('APP_URL')}/podcasts/${podcast.id}`;

      // LinkedIn API
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: `urn:li:person:${account.platformUserId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: message,
              },
              shareMediaCategory: 'ARTICLE',
              media: [
                {
                  status: 'READY',
                  originalUrl: link,
                  title: {
                    text: podcast.title,
                  },
                  description: {
                    text: podcast.description,
                  },
                },
              ],
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        },
      );

      this.logger.log(`Podcast ${podcast.id} shared on LinkedIn`);

      return {
        success: true,
        postId: response.headers['x-restli-id'],
        sharedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to share on LinkedIn: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async shareOnAllPlatforms(userId: number, podcast: Podcast) {
    const results = {
      facebook: await this.shareOnFacebook(userId, podcast),
      twitter: await this.shareOnTwitter(userId, podcast),
      linkedin: await this.shareOnLinkedIn(userId, podcast),
    };

    return results;
  }

  private formatPodcastMessage(podcast: Podcast, maxLength?: number): string {
    const type =
      podcast.type === 'video' ? '🎥 Nouvelle vidéo' : '🎙️ Nouveau podcast';
    let message = `${type}: ${podcast.title}\n\n${podcast.description}`;

    if (podcast.tags && podcast.tags.length > 0) {
      const hashtags = podcast.tags
        .map((tag) => `#${tag.replace(/\s+/g, '')}`)
        .join(' ');
      message += `\n\n${hashtags}`;
    }

    if (maxLength && message.length > maxLength - 50) {
      message = message.substring(0, maxLength - 50) + '...';
    }

    return message;
  }

  // ✅ Connexion des comptes sociaux - CORRIGÉ
  async connectSocialAccount(
    userId: number,
    platform: SocialPlatform,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number,
    platformUserId?: string,
    platformUsername?: string,
  ): Promise<SocialAccount> {
    // Désactiver les anciens comptes
    await this.socialAccountRepository.update(
      { userId, platform },
      { isActive: false },
    );

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // ✅ CORRIGÉ: Créer l'objet correctement
    const accountData = {
      userId,
      platform,
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt: expiresAt || undefined,
      platformUserId: platformUserId || undefined,
      platformUsername: platformUsername || undefined,
      isActive: true,
    };

    const account = this.socialAccountRepository.create(accountData);

    return await this.socialAccountRepository.save(account);
  }

  async disconnectSocialAccount(userId: number, platform: SocialPlatform) {
    await this.socialAccountRepository.update(
      { userId, platform },
      { isActive: false },
    );
  }

  async getUserSocialAccounts(userId: number): Promise<SocialAccount[]> {
    return await this.socialAccountRepository.find({
      where: { userId, isActive: true },
      select: ['id', 'platform', 'platformUsername', 'connectedAt'],
    });
  }
}
