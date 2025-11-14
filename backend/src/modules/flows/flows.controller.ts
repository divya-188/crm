import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuotaGuard } from '../subscriptions/guards/quota.guard';
import { QuotaResource } from '../subscriptions/decorators/quota.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FlowsService } from './flows.service';
import { FlowExecutionService } from './services/flow-execution.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';

@ApiTags('Flows')
@ApiBearerAuth()
@Controller('flows')
@UseGuards(JwtAuthGuard)
export class FlowsController {
  constructor(
    private readonly flowsService: FlowsService,
    private readonly flowExecutionService: FlowExecutionService,
  ) {}

  @Post()
  @UseGuards(QuotaGuard)
  @QuotaResource('flows')
  @ApiOperation({ summary: 'Create a new chatbot flow' })
  @ApiResponse({ status: 201, description: 'Flow created successfully' })
  @ApiResponse({ status: 403, description: 'Quota limit exceeded' })
  create(@CurrentUser() user: any, @Body() createFlowDto: CreateFlowDto) {
    return this.flowsService.create(user.tenantId, createFlowDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all flows' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Flows retrieved successfully' })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.flowsService.findAll(user.tenantId, { page, limit, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flow by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Flow retrieved successfully' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.flowsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update flow' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Flow updated successfully' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateFlowDto: UpdateFlowDto,
  ) {
    return this.flowsService.update(id, user.tenantId, updateFlowDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete flow' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Flow deleted successfully' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.flowsService.remove(id, user.tenantId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate flow' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Flow duplicated successfully' })
  duplicate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.flowsService.duplicate(id, user.tenantId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate flow' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Flow activated successfully' })
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.flowsService.updateStatus(id, user.tenantId, 'active');
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate flow' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Flow deactivated successfully' })
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.flowsService.updateStatus(id, user.tenantId, 'inactive');
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute flow manually' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Flow execution started' })
  async executeFlow(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { conversationId: string; contactId: string; context?: any },
  ) {
    return this.flowExecutionService.startExecution(
      id,
      body.conversationId,
      body.contactId,
      body.context,
    );
  }

  @Get('executions/:executionId')
  @ApiOperation({ summary: 'Get flow execution details' })
  @ApiParam({ name: 'executionId', type: String })
  @ApiResponse({ status: 200, description: 'Execution retrieved successfully' })
  getExecution(@Param('executionId') executionId: string) {
    return this.flowExecutionService.getExecution(executionId);
  }

  @Post('executions/:executionId/resume')
  @ApiOperation({ summary: 'Resume paused flow execution' })
  @ApiParam({ name: 'executionId', type: String })
  @ApiResponse({ status: 200, description: 'Execution resumed successfully' })
  resumeExecution(
    @Param('executionId') executionId: string,
    @Body() body: { userInput: any },
  ) {
    return this.flowExecutionService.resumeExecution(
      executionId,
      body.userInput,
    );
  }

  @Post('executions/:executionId/cancel')
  @ApiOperation({ summary: 'Cancel flow execution' })
  @ApiParam({ name: 'executionId', type: String })
  @ApiResponse({ status: 200, description: 'Execution cancelled successfully' })
  cancelExecution(@Param('executionId') executionId: string) {
    return this.flowExecutionService.cancelExecution(executionId);
  }

  @Get('conversations/:conversationId/executions')
  @ApiOperation({ summary: 'Get all executions for a conversation' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiResponse({ status: 200, description: 'Executions retrieved successfully' })
  getConversationExecutions(@Param('conversationId') conversationId: string) {
    return this.flowExecutionService.getExecutionsByConversation(
      conversationId,
    );
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test flow in sandbox mode with step-by-step execution' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Flow test execution completed' })
  async testFlow(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { testData?: any },
  ) {
    return this.flowExecutionService.testFlowExecution(
      id,
      user.tenantId,
      body.testData || {},
    );
  }

  @Get('executions/:executionId/logs')
  @ApiOperation({ summary: 'Get execution logs for debugging' })
  @ApiParam({ name: 'executionId', type: String })
  @ApiResponse({ status: 200, description: 'Execution logs retrieved successfully' })
  getExecutionLogs(@Param('executionId') executionId: string) {
    return this.flowExecutionService.getExecutionLogs(executionId);
  }

  @Get('executions/:executionId/replay')
  @ApiOperation({ summary: 'Get execution replay data for visualization' })
  @ApiParam({ name: 'executionId', type: String })
  @ApiResponse({ status: 200, description: 'Execution replay data retrieved successfully' })
  getExecutionReplay(@Param('executionId') executionId: string) {
    return this.flowExecutionService.getExecutionReplay(executionId);
  }

  // TODO: Implement these methods in FlowsService
  // @Get(':id/analytics')
  // @ApiOperation({ summary: 'Get flow analytics and performance metrics' })
  // @ApiParam({ name: 'id', type: String })
  // @ApiResponse({ status: 200, description: 'Flow analytics retrieved successfully' })
  // getFlowAnalytics(@CurrentUser() user: any, @Param('id') id: string) {
  //   return this.flowsService.getFlowAnalytics(id, user.tenantId);
  // }

  // @Get(':id/executions')
  // @ApiOperation({ summary: 'Get flow execution history' })
  // @ApiParam({ name: 'id', type: String })
  // @ApiQuery({ name: 'page', required: false, type: Number })
  // @ApiQuery({ name: 'limit', required: false, type: Number })
  // @ApiResponse({ status: 200, description: 'Flow executions retrieved successfully' })
  // getFlowExecutions(
  //   @CurrentUser() user: any,
  //   @Param('id') id: string,
  //   @Query('page') page: number = 1,
  //   @Query('limit') limit: number = 20,
  // ) {
  //   return this.flowsService.getFlowExecutions(id, user.tenantId, { page, limit });
  // }

  // @Post(':id/version')
  // @ApiOperation({ summary: 'Create a new version of the flow' })
  // @ApiParam({ name: 'id', type: String })
  // @ApiResponse({ status: 201, description: 'Flow version created successfully' })
  // createVersion(@CurrentUser() user: any, @Param('id') id: string) {
  //   return this.flowsService.createVersion(id, user.tenantId);
  // }

  // @Get(':id/versions')
  // @ApiOperation({ summary: 'Get all versions of a flow' })
  // @ApiParam({ name: 'id', type: String })
  // @ApiResponse({ status: 200, description: 'Flow versions retrieved successfully' })
  // getVersions(@CurrentUser() user: any, @Param('id') id: string) {
  //   return this.flowsService.getVersions(id, user.tenantId);
  // }
}
