import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionPlansController {
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  @Post()
  @Roles('super_admin')
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.subscriptionPlansService.create(createPlanDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const includeInactiveBool = includeInactive === 'true';
    return this.subscriptionPlansService.findAll(page, limit, includeInactiveBool);
  }

  @Get('compare')
  compare() {
    return this.subscriptionPlansService.compare();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionPlansService.findOne(id);
  }

  @Get(':id/check-feature/:feature')
  checkFeature(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('feature') feature: string,
  ) {
    return this.subscriptionPlansService.checkFeature(id, feature);
  }

  @Get(':id/check-limit/:limitKey')
  checkLimit(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('limitKey') limitKey: string,
  ) {
    return this.subscriptionPlansService.checkLimit(id, limitKey);
  }

  @Patch(':id')
  @Roles('super_admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.subscriptionPlansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionPlansService.remove(id);
  }
}
