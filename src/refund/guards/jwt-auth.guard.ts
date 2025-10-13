import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

/**
 * Configurable JWT Authentication Guard
 * 
 * Features:
 * - Can be enabled/disabled via AUTH_ENABLED environment variable
 * - Respects @Public() decorator for public routes
 * - Automatically protects all routes when enabled
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if authentication is enabled via environment variable
    const authEnabled = this.configService.get<string>('AUTH_ENABLED', 'false');
    
    if (authEnabled === 'false' || authEnabled === '0') {
      // Auth is disabled globally - allow all requests
      return true;
    }

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Route is public - allow without authentication
      return true;
    }

    // Auth is enabled and route is not public - require JWT
    return super.canActivate(context);
  }
}

