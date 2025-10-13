import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'traya-refund-secret-key-2025',
    });
  }

  async validate(payload: any) {
    if (payload.type === 'user') {
      const user = await this.authService.validateUser(payload);
      if (!user) {
        throw new UnauthorizedException('Invalid token or user not found');
      }
      return { ...user, type: 'user' };
    } else if (payload.type === 'customer') {
      const customer = await this.authService.validateCustomer(payload);
      if (!customer) {
        throw new UnauthorizedException('Invalid token or customer not found');
      }
      return { ...customer, type: 'customer' };
    }
    throw new UnauthorizedException('Invalid token type');
  }
}

