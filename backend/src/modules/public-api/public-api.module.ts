import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ContactsModule } from '../contacts/contacts.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { TemplatesModule } from '../templates/templates.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { RedisService } from '../../common/services/redis.service';

@Module({
  imports: [
    ApiKeysModule,
    ContactsModule,
    ConversationsModule,
    TemplatesModule,
    CampaignsModule,
  ],
  controllers: [PublicApiController],
  providers: [RedisService],
})
export class PublicApiModule {}
