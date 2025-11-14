import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { FlowStatus } from '../entities/flow.entity';

export class CreateFlowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  flowData: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }>;
  };

  @IsOptional()
  @IsObject()
  triggerConfig?: {
    type: 'keyword' | 'welcome' | 'manual' | 'webhook';
    keywords?: string[];
    conditions?: Record<string, any>;
  };

  @IsOptional()
  @IsEnum(FlowStatus)
  status?: string;
}
