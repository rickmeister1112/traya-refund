import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from '../entities';
import { TransactionType, PaymentStatus } from '../enums';

@Injectable()
export class PaymentTransactionService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepository: Repository<PaymentTransaction>,
  ) {}

  /**
   * Get all payment transactions for a customer
   */
  async getCustomerTransactions(customerId: string): Promise<PaymentTransaction[]> {
    return await this.paymentTransactionRepository.find({
      where: { customerId },
      order: { transactionDate: 'DESC' },
    });
  }

  /**
   * Get customer balance (total payments - total refunds)
   */
  async getCustomerBalance(customerId: string): Promise<{
    customerId: string;
    totalPayments: number;
    totalRefunds: number;
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    transactionCount: number;
  }> {
    const transactions = await this.paymentTransactionRepository.find({
      where: {
        customerId,
        paymentStatus: PaymentStatus.COMPLETED,
        isVoid: false,
      },
    });

    const totalPayments = transactions
      .filter((t) => t.transactionType === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalRefunds = transactions
      .filter((t) => t.transactionType === TransactionType.REFUND)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCredits = transactions
      .filter((t) => t.transactionType === TransactionType.CREDIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDebits = transactions
      .filter((t) => t.transactionType === TransactionType.DEBIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Net = (Payments + Credits) - (Refunds + Debits)
    const netAmount = totalPayments + totalCredits - totalRefunds - totalDebits;

    return {
      customerId,
      totalPayments,
      totalRefunds,
      totalCredits,
      totalDebits,
      netAmount,
      transactionCount: transactions.length,
    };
  }

  /**
   * Get all transactions by type
   */
  async getTransactionsByType(
    transactionType: TransactionType,
  ): Promise<PaymentTransaction[]> {
    return await this.paymentTransactionRepository.find({
      where: { transactionType },
      order: { transactionDate: 'DESC' },
      take: 100, // Limit to recent 100
    });
  }

  /**
   * Get transaction by transaction number
   */
  async getByTransactionNumber(transactionNumber: string): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionRepository.findOne({
      where: { transactionNumber },
      relations: ['customer'],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with number ${transactionNumber} not found`,
      );
    }

    return transaction;
  }

  /**
   * Get pending settlements
   */
  async getPendingSettlements(): Promise<PaymentTransaction[]> {
    return await this.paymentTransactionRepository.find({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        isSettled: false,
      },
      order: { transactionDate: 'DESC' },
    });
  }

  /**
   * Mark transaction as settled
   */
  async markAsSettled(
    transactionNumber: string,
    settlementReferenceNumber: string,
  ): Promise<PaymentTransaction> {
    const transaction = await this.getByTransactionNumber(transactionNumber);

    transaction.isSettled = true;
    transaction.settledAt = new Date();
    transaction.settlementReferenceNumber = settlementReferenceNumber;

    return await this.paymentTransactionRepository.save(transaction);
  }

  /**
   * Void a transaction
   */
  async voidTransaction(
    transactionNumber: string,
    voidReason: string,
  ): Promise<PaymentTransaction> {
    const transaction = await this.getByTransactionNumber(transactionNumber);

    transaction.isVoid = true;
    transaction.voidReason = voidReason;
    transaction.voidedAt = new Date();

    return await this.paymentTransactionRepository.save(transaction);
  }

  /**
   * Get all transactions (with pagination)
   */
  async getAllTransactions(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    transactions: PaymentTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [transactions, total] = await this.paymentTransactionRepository.findAndCount({
      order: { transactionDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['customer'],
    });

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

