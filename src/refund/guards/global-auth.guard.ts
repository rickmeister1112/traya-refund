import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Global Authentication Guard
 * 
 * This guard is applied globally to all routes in the application.
 * It can be toggled on/off using the AUTH_ENABLED environment variable.
 * 
 * Features:
 * - Centralized authentication control
 * - Environment-based toggle (AUTH_ENABLED=true/false)
 * - Supports public routes via @Public() decorator
 * - Protects all routes by default when enabled
 * 
 * Usage:
 * - Set AUTH_ENABLED=true in .env to enable authentication
 * - Set AUTH_ENABLED=false in .env to disable authentication
 * - Use @Public() decorator on login/signup routes
 */
@Injectable()
export class GlobalAuthGuard extends JwtAuthGuard {
  constructor(
    reflector: Reflector,
    configService: ConfigService,
  ) {
    super(reflector, configService);
  }
}

