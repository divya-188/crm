import { SetMetadata } from '@nestjs/common';

export const READ_ONLY_KEY = 'template_read_only';

/**
 * Decorator to mark a template operation as read-only
 * When applied, only users with appropriate permissions can perform write operations
 * 
 * Usage:
 * @ReadOnly()
 * 
 * Requirement 17.5: Read-only mode for specific users
 */
export const ReadOnly = () => SetMetadata(READ_ONLY_KEY, true);
