import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract user ID from the request
 * Assumes JWT authentication has already populated req.user
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id || request.user?.userId;
  },
);
