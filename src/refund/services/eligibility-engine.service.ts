import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Order, CallLog, Transaction, Ticket } from '../entities';

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  checks: {
    alreadyReceivedRefund: boolean;
    purchasedCompleteKits: boolean;
    kitsDeliveredInTimeframe: boolean;
    completedThreeCalls: boolean;
    raisedWithinWindow: boolean;
  };
  eligibleRefundAmount: number;
  recommendedTreatmentPeriod: number;
}

@Injectable()
export class EligibilityEngineService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(CallLog)
    private callLogRepository: Repository<CallLog>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async checkEligibility(customerId: string): Promise<EligibilityResult> {
    const reasons: string[] = [];
    const checks = {
      alreadyReceivedRefund: false,
      purchasedCompleteKits: false,
      kitsDeliveredInTimeframe: false,
      completedThreeCalls: false,
      raisedWithinWindow: false,
    };

    const orders = await this.orderRepository.find({
      where: { customerId, isVoid: false },
      order: { createdAt: 'ASC' },
    });

    if (orders.length === 0) {
      reasons.push('No orders found for this customer.');
      return {
        isEligible: false,
        reasons,
        checks,
        eligibleRefundAmount: 0,
        recommendedTreatmentPeriod: 0,
      };
    }

    const firstOrder = orders[0];
    const recommendedTreatmentPeriod = firstOrder.treatmentDurationMonths;

    const previousRefunds = await this.ticketRepository.find({
      where: {
        customerId,
        isApproved: true,
        status: 'approved' as any,
      },
    });

    if (previousRefunds.length > 0) {
      reasons.push('Customer has already received a money-back refund.');
    } else {
      checks.alreadyReceivedRefund = true;
    }

    const kitOrders = orders.filter(
      (order) =>
        order.isRecommendedKit &&
        order.productCount > 3 &&
        order.isDelivered,
    );

    const requiredKits =
      recommendedTreatmentPeriod === 5
        ? 5
        : recommendedTreatmentPeriod === 8
          ? 8
          : 12;

    const maxMonths =
      recommendedTreatmentPeriod === 5
        ? 6
        : recommendedTreatmentPeriod === 8
          ? 9
          : 13;

    if (kitOrders.length >= requiredKits) {
      checks.purchasedCompleteKits = true;
    } else {
      reasons.push(
        `Customer has only purchased ${kitOrders.length} kits out of required ${requiredKits} kits.`,
      );
    }

    if (kitOrders.length >= requiredKits) {
      const firstKitDate = new Date(kitOrders[0].deliveredAt);
      const lastRequiredKitDate = new Date(
        kitOrders[requiredKits - 1].deliveredAt,
      );

      const monthsDiff = this.getMonthsDifference(
        firstKitDate,
        lastRequiredKitDate,
      );

      if (monthsDiff <= maxMonths) {
        checks.kitsDeliveredInTimeframe = true;
      } else {
        reasons.push(
          `The ${requiredKits} kits were delivered over ${monthsDiff} months, which exceeds the required ${maxMonths} months timeframe.`,
        );
      }
    }

    const connectedCalls = await this.callLogRepository.count({
      where: {
        customerId,
        isConnected: true,
        callType: 'hair_coach' as any,
      },
    });

    if (connectedCalls >= 3) {
      checks.completedThreeCalls = true;
    } else {
      reasons.push(
        `Customer has completed only ${connectedCalls} calls with Hair Coach. Required: 3 calls.`,
      );
    }

    if (kitOrders.length >= requiredKits) {
      const requiredKitOrder = orders.find((order, index) => {

        return (
          order.isRecommendedKit &&
          order.productCount > 3 &&
          orders.filter(
            (o, i) =>
              i <= index &&
              o.isRecommendedKit &&
              o.productCount > 3,
          ).length === requiredKits
        );
      });

      if (requiredKitOrder) {
        const orderDate = new Date(requiredKitOrder.createdAt);
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff <= 30) {
          checks.raisedWithinWindow = true;
        } else {
          reasons.push(
            `Money-back request must be raised within 30 days of placing the ${requiredKits}${this.getOrdinalSuffix(requiredKits)} kit order. ${daysDiff} days have passed.`,
          );
        }
      }
    } else {
      reasons.push(
        `Customer has not yet placed the ${requiredKits}${this.getOrdinalSuffix(requiredKits)} kit order.`,
      );
    }

    const eligibleRefundAmount =
      await this.calculateEligibleRefundAmount(customerId);

    const isEligible =
      checks.alreadyReceivedRefund &&
      checks.purchasedCompleteKits &&
      checks.kitsDeliveredInTimeframe &&
      checks.completedThreeCalls &&
      checks.raisedWithinWindow;

    return {
      isEligible,
      reasons,
      checks,
      eligibleRefundAmount,
      recommendedTreatmentPeriod,
    };
  }

  async calculateEligibleRefundAmount(customerId: string): Promise<number> {

    const deliveredOrders = await this.orderRepository.find({
      where: {
        customerId,
        isDelivered: true,
        isVoid: false,
      },
    });

    const totalOrderAmount = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const refundTransactions = await this.transactionRepository.find({
      where: {
        customerId,
        isRefund: true,
        isProcessed: true,
      },
    });

    const totalRefunded = refundTransactions.reduce(
      (sum, txn) => sum + Number(txn.amount),
      0,
    );

    const eligibleAmount = totalOrderAmount - totalRefunded;

    return Math.max(0, eligibleAmount);
  }

  private getMonthsDifference(date1: Date, date2: Date): number {
    const yearsDiff = date2.getFullYear() - date1.getFullYear();
    const monthsDiff = date2.getMonth() - date1.getMonth();
    return yearsDiff * 12 + monthsDiff + 1;
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  }

  async hasNonVoidCODOrders(customerId: string): Promise<boolean> {
    const codOrders = await this.orderRepository.count({
      where: {
        customerId,
        paymentMode: 'cod',
        isVoid: false,
      },
    });

    return codOrders > 0;
  }

  async hasBankDetails(customerId: string): Promise<boolean> {

    return false;
  }
}

