import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderHistory, Customer, CustomerPrescription, Product } from '../entities';

@Controller('order-history')
export class OrderHistoryController {
  constructor(
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerPrescription)
    private prescriptionRepository: Repository<CustomerPrescription>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body()
    data: {
      customerId: string;
      prescriptionId: string;
      productId: string;
      kitNumber: number;
      quantity: number;
      paymentMode: string;
      isFreeKit?: boolean;
    },
  ) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const product = await this.productRepository.findOne({
      where: { id: data.productId },
    });

    const totalAmount = Number(product.price) * data.quantity;

    const order = this.orderHistoryRepository.create({
      orderNumber,
      customerId: data.customerId,
      prescriptionId: data.prescriptionId,
      productId: data.productId,
      kitNumber: data.kitNumber,
      quantity: data.quantity,
      price: product.price,
      totalAmount,
      paymentMode: data.paymentMode,
      orderedAt: new Date(),
      orderStatus: 'confirmed',
      isFreeKit: data.isFreeKit || false,
    });

    return await this.orderHistoryRepository.save(order);
  }

  @Get()
  async getAllOrders(
    @Query('customerId') customerId?: string,
    @Query('prescriptionId') prescriptionId?: string,
    @Query('kitNumber') kitNumber?: number,
  ) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (prescriptionId) where.prescriptionId = prescriptionId;
    if (kitNumber) where.kitNumber = Number(kitNumber);

    return await this.orderHistoryRepository.find({
      where,
      relations: ['customer', 'prescription', 'product'],
      order: { orderedAt: 'DESC' },
    });
  }

  @Get('customer/:customerId')
  async getOrdersByCustomer(@Param('customerId') customerId: string) {
    return await this.orderHistoryRepository.find({
      where: { customerId },
      relations: ['product', 'prescription'],
      order: { kitNumber: 'ASC', orderedAt: 'ASC' },
    });
  }

  @Get('prescription/:prescriptionId')
  async getOrdersByPrescription(@Param('prescriptionId') prescriptionId: string) {
    return await this.orderHistoryRepository.find({
      where: { prescriptionId },
      relations: ['product'],
      order: { kitNumber: 'ASC' },
    });
  }

  @Get('prescription/:prescriptionId/kit/:kitNumber')
  async getKitOrders(
    @Param('prescriptionId') prescriptionId: string,
    @Param('kitNumber') kitNumber: number,
  ) {
    return await this.orderHistoryRepository.find({
      where: { prescriptionId, kitNumber: Number(kitNumber) },
      relations: ['product'],
    });
  }

  @Patch(':id/mark-delivered')
  async markDelivered(@Param('id') id: string) {
    const order = await this.orderHistoryRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new Error(`Order not found with ID: ${id}`);
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.orderStatus = 'delivered';

    return await this.orderHistoryRepository.save(order);
  }

  @Get('prescription/:prescriptionId/kit-status')
  async getKitStatus(@Param('prescriptionId') prescriptionId: string) {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id: prescriptionId },
    });

    const orders = await this.orderHistoryRepository.find({
      where: { prescriptionId, isVoid: false },
      relations: ['product'],
    });

    const kitStatus = {};
    for (let i = 1; i <= prescription.requiredKits; i++) {
      const kitOrders = orders.filter((o) => o.kitNumber === i);
      const delivered = kitOrders.filter((o) => o.isDelivered);

      kitStatus[`kit_${i}`] = {
        kitNumber: i,
        totalOrders: kitOrders.length,
        delivered: delivered.length,
        isComplete: delivered.length > 0,
        deliveryDate: delivered[0]?.deliveredAt || null,
        products: kitOrders.map((o) => ({
          name: o.product.name,
          isDelivered: o.isDelivered,
          deliveredAt: o.deliveredAt,
        })),
      };
    }

    return {
      prescriptionId,
      treatmentDurationMonths: prescription.treatmentDurationMonths,
      requiredKits: prescription.requiredKits,
      kitStatus,
    };
  }
}

