import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Campaign } from './entities/campaign.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Template } from '../templates/entities/template.entity';
import { WhatsAppConfig } from '../tenants/entities/whatsapp-config.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignExecutorService } from './services/campaign-executor.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, Contact, Template, WhatsAppConfig]),
    ConfigModule,
    SubscriptionsModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignExecutorService],
  exports: [CampaignsService, CampaignExecutorService],
})
export class CampaignsModule {}
