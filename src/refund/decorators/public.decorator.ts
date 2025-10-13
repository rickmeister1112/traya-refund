import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * 
 * Use this decorator to mark routes as public (no authentication required)
 * even when AUTH_ENABLED is set to true.
 * 
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);

