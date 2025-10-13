import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Client = createParamDecorator((ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.client ? request.client : null;
});
