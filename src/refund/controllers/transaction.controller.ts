import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities';

@Controller('transactions')
export class TransactionController {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  @Get('customer/:customerId')
  async getCustomerTransactions(@Param('customerId') customerId: string) {
    const transactions = await this.transactionRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      relations: ['order'],
    });

    const payments = transactions.filter((t) => !t.isRefund);
    const refunds = transactions.filter((t) => t.isRefund);

    const totalPaid = payments.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalRefunded = refunds.reduce((sum, t) => sum + Number(t.amount), 0);
    const netAmount = totalPaid - totalRefunded;

    return {
      customerId,
      summary: {
        totalPaid,
        totalRefunded,
        netAmount,
        paymentCount: payments.length,
        refundCount: refunds.length,
      },
      transactions: {
        payments,
        refunds,
      },
    };
  }

  @Get('order/:orderId')
  async getOrderTransactions(@Param('orderId') orderId: string) {
    return await this.transactionRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get('refunds')
  async getRefunds(@Query('customerId') customerId?: string) {
    const where: any = { isRefund: true };
    if (customerId) {
      where.customerId = customerId;
    }

    return await this.transactionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['customer', 'order'],
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() createTransactionDto: any) {
    const transaction = this.transactionRepository.create(createTransactionDto);
    return await this.transactionRepository.save(transaction);
  }

  @Get(':id')
  async getTransaction(@Param('id') id: string) {
    return await this.transactionRepository.findOne({
      where: { id },
      relations: ['customer', 'order'],
    });
  }
}

