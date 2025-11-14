import { SetMetadata } from '@nestjs/common';

export const ApiPermissions = (resource: string, action: string) =>
  SetMetadata('apiPermissions', { resource, action });
