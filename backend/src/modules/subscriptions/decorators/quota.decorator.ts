import { SetMetadata } from '@nestjs/common';

export const QUOTA_RESOURCE_KEY = 'quota_resource';

/**
 * Decorator to mark endpoints that require quota enforcement
 * @param resourceType - The type of resource being created (contacts, users, campaigns, etc.)
 * 
 * @example
 * @Post()
 * @QuotaResource('contacts')
 * create(@Body() dto: CreateContactDto) {
 *   // ...
 * }
 */
export const QuotaResource = (resourceType: string) => 
  SetMetadata(QUOTA_RESOURCE_KEY, resourceType);
