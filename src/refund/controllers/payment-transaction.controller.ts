import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentTransactionService } from '../services/payment-transaction.service';
import { TransactionType } from '../enums';

@Controller('payment-transactions')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  /**
   * Get all payment transactions (paginated)
   * GET /payment-transactions?page=1&limit=50
   */
  @Get()
  async getAllTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.paymentTransactionService.getAllTransactions(
      page || 1,
      limit || 50,
    );
  }

  /**
   * Get all transactions for a customer
   * GET /payment-transactions/customer/:customerId
   */
  @Get('customer/:customerId')
  async getCustomerTransactions(@Param('customerId') customerId: string) {
    const transactions =
      await this.paymentTransactionService.getCustomerTransactions(customerId);

    return {
      customerId,
      count: transactions.length,
      transactions,
    };
  }

  /**
   * Get customer balance
   * GET /payment-transactions/customer/:customerId/balance
   */
  @Get('customer/:customerId/balance')
  async getCustomerBalance(@Param('customerId') customerId: string) {
    return await this.paymentTransactionService.getCustomerBalance(customerId);
  }

  /**
   * Get transactions by type
   * GET /payment-transactions/type/:type
   * Types: payment, refund, credit, debit
   */
  @Get('type/:type')
  async getTransactionsByType(@Param('type') type: string) {
    const transactionType = type.toUpperCase() as TransactionType;
    const transactions =
      await this.paymentTransactionService.getTransactionsByType(transactionType);

    return {
      transactionType: type,
      count: transactions.length,
      transactions,
    };
  }

  /**
   * Get transaction by transaction number
   * GET /payment-transactions/number/:transactionNumber
   */
  @Get('number/:transactionNumber')
  async getByTransactionNumber(
    @Param('transactionNumber') transactionNumber: string,
  ) {
    return await this.paymentTransactionService.getByTransactionNumber(
      transactionNumber,
    );
  }

  /**
   * Get pending settlements
   * GET /payment-transactions/settlements/pending
   */
  @Get('settlements/pending')
  async getPendingSettlements() {
    const transactions =
      await this.paymentTransactionService.getPendingSettlements();

    return {
      count: transactions.length,
      transactions,
    };
  }

  /**
   * Mark transaction as settled
   * PATCH /payment-transactions/:transactionNumber/settle
   */
  @Patch(':transactionNumber/settle')
  @HttpCode(HttpStatus.OK)
  async markAsSettled(
    @Param('transactionNumber') transactionNumber: string,
    @Body('settlementReferenceNumber') settlementReferenceNumber: string,
  ) {
    return await this.paymentTransactionService.markAsSettled(
      transactionNumber,
      settlementReferenceNumber,
    );
  }

  /**
   * Void a transaction
   * PATCH /payment-transactions/:transactionNumber/void
   */
  @Patch(':transactionNumber/void')
  @HttpCode(HttpStatus.OK)
  async voidTransaction(
    @Param('transactionNumber') transactionNumber: string,
    @Body('voidReason') voidReason: string,
  ) {
    return await this.paymentTransactionService.voidTransaction(
      transactionNumber,
      voidReason,
    );
  }
}

