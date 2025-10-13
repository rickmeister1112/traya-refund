import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, Customer } from '../entities';
import { CreateOrderDto } from '../dto';

@Controller('orders')
export class OrderController {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = this.orderRepository.create({
      ...createOrderDto,
      orderNumber,
      products: JSON.stringify(createOrderDto.products),
      productCount: createOrderDto.products.length,
      monthsCompleted: 0,
      isRegular: false,
    });

    return await this.orderRepository.save(order);
  }

  @Get()
  async getAllOrders() {
    return await this.orderRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'tickets'],
    });
  }

  @Patch(':id/progress')
  async updateOrderProgress(
    @Param('id') id: string,
    @Body('monthsCompleted') monthsCompleted: number,
  ) {
    const order = await this.orderRepository.findOne({ where: { id } });

    order.monthsCompleted = monthsCompleted;
    order.isRegular = monthsCompleted >= order.treatmentDurationMonths;

    return await this.orderRepository.save(order);
  }

  @Patch(':id/mark-delivered')
  async markDelivered(@Param('id') id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });

    order.isDelivered = true;
    order.deliveredAt = new Date();

    return await this.orderRepository.save(order);
  }
}

