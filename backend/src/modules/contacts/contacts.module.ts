import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { ContactSegment } from './entities/segment.entity';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, ContactSegment, CustomFieldDefinition]),
    SubscriptionsModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
