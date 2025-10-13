import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { CustomerSignupDto, UserSignupDto } from '../dto/signup.dto';
import { Public } from '../decorators/public.decorator';

/**
 * Authentication Controller
 * 
 * All routes in this controller are marked as @Public() so they are
 * accessible even when AUTH_ENABLED=true
 */
@Controller('auth')
@Public() // Mark entire controller as public
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('customer/signup')
  @HttpCode(HttpStatus.CREATED)
  async customerSignup(@Body() signupDto: CustomerSignupDto): Promise<AuthResponseDto> {
    return await this.authService.customerSignup(signupDto);
  }

  @Post('user/signup')
  @HttpCode(HttpStatus.CREATED)
  async userSignup(@Body() signupDto: UserSignupDto): Promise<AuthResponseDto> {
    return await this.authService.userSignup(signupDto);
  }

  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  async customerLogin(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.customerLogin(loginDto);
  }

  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  async userLogin(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.userLogin(loginDto);
  }
}

