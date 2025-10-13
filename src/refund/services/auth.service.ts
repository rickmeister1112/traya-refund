import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { CustomerSignupDto, UserSignupDto } from '../dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async customerSignup(signupDto: CustomerSignupDto): Promise<AuthResponseDto> {

    const existingCustomer = await this.customerRepository.findOne({
      where: { email: signupDto.email },
    });

    if (existingCustomer) {
      throw new ConflictException('Email already registered');
    }

    const existingPhone = await this.customerRepository.findOne({
      where: { phone: signupDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    const hashedPassword = await this.hashPassword(signupDto.password);

    const customer = this.customerRepository.create({
      name: signupDto.name,
      email: signupDto.email,
      password: hashedPassword,
      phone: signupDto.phone,
      address: signupDto.address,
      isActive: true,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    const payload = {
      sub: savedCustomer.id,
      email: savedCustomer.email,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      customer: {
        id: savedCustomer.id,
        email: savedCustomer.email,
        name: savedCustomer.name,
        phone: savedCustomer.phone,
      },
    };
  }

  async userSignup(signupDto: UserSignupDto): Promise<AuthResponseDto> {

    const existingUser = await this.userRepository.findOne({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingEmployee = await this.userRepository.findOne({
      where: { employeeId: signupDto.employeeId },
    });

    if (existingEmployee) {
      throw new ConflictException('Employee ID already registered');
    }

    const hashedPassword = await this.hashPassword(signupDto.password);

    const user = this.userRepository.create({
      name: signupDto.name,
      email: signupDto.email,
      password: hashedPassword,
      employeeId: signupDto.employeeId,
      phone: signupDto.phone,
      userTypeId: signupDto.userTypeId,
      department: signupDto.department,
      designation: signupDto.designation,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    const userWithType = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['userType'],
    });

    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      type: 'user',
      userTypeId: savedUser.userTypeId,
      department: savedUser.department,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        userType: userWithType?.userType?.name || 'N/A',
      },
    };
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async customerLogin(loginDto: LoginDto): Promise<AuthResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Customer account is inactive');
    }

    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      customer.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      },
    };
  }

  async userLogin(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['userType'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      type: 'user',
      userTypeId: user.userTypeId,
      department: user.department,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType?.name || 'N/A',
      },
    };
  }

  async validateUser(payload: any): Promise<User | null> {
    if (payload.type !== 'user') {
      return null;
    }
    return await this.userRepository.findOne({
      where: { id: payload.sub },
    });
  }

  async validateCustomer(payload: any): Promise<Customer | null> {
    if (payload.type !== 'customer') {
      return null;
    }
    return await this.customerRepository.findOne({
      where: { id: payload.sub },
    });
  }
}

