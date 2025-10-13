import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities';
import { CreateCustomerDto } from '../dto';

@Controller('customers')
export class CustomerController {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  @Get()
  async getAllCustomers() {
    return await this.customerRepository.find({
      relations: ['orders', 'tickets'],
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string) {
    return await this.customerRepository.findOne({
      where: { id },
      relations: ['orders', 'tickets'],
    });
  }
}

