import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrderHistory,
  HairCoachCall,
  Transaction,
  Ticket,
  CustomerPrescription,
  PrescriptionProduct,
} from '../entities';
import { KitValidationService } from './kit-validation.service';
import { KitCalculator } from '../utils/kit-calculator.util';

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  checks: {
    alreadyReceivedRefund: boolean;
    purchasedCompleteKits: boolean;
    purchasedAllEssentialProducts: boolean;
    kitsDeliveredInTimeframe: boolean;
    completedThreeCalls: boolean;
    raisedWithinWindow: boolean;
  };
  eligibleRefundAmount: number;
  recommendedTreatmentPeriod: number;
  prescriptionId: string;
  missingEssentialProducts?: { kitNumber: number; products: string[] }[];
}

@Injectable()
export class EligibilityEngineV2Service {
  constructor(
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(HairCoachCall)
    private hairCoachCallRepository: Repository<HairCoachCall>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(CustomerPrescription)
    private prescriptionRepository: Repository<CustomerPrescription>,
    @InjectRepository(PrescriptionProduct)
    private prescriptionProductRepository: Repository<PrescriptionProduct>,
    private kitValidationService: KitValidationService,
  ) {}

  async checkEligibility(customerId: string): Promise<EligibilityResult> {
    const reasons: string[] = [];
    const checks = {
      alreadyReceivedRefund: false,
      purchasedCompleteKits: false,
      purchasedAllEssentialProducts: false,
      kitsDeliveredInTimeframe: false,
      completedThreeCalls: false,
      raisedWithinWindow: false,
    };
    const missingEssentialProducts: { kitNumber: number; products: string[] }[] = [];

    const prescription = await this.prescriptionRepository.findOne({
      where: { customerId, isActive: true },
      relations: ['prescribedProducts'],
      order: { prescribedAt: 'DESC' },
    });

    if (!prescription) {
      reasons.push('No active prescription found for this customer.');
      return {
        isEligible: false,
        reasons,
        checks,
        eligibleRefundAmount: 0,
        recommendedTreatmentPeriod: 0,
        prescriptionId: null,
        missingEssentialProducts: [],
      };
    }

    const recommendedTreatmentPeriod = prescription.treatmentDurationMonths;
    const requiredKits = prescription.requiredKits;

    const previousRefunds = await this.ticketRepository.find({
      where: {
        customerId,
        isApproved: true,
      },
    });

    if (previousRefunds.length > 0) {
      reasons.push('Customer has already received a money-back refund.');
    } else {
      checks.alreadyReceivedRefund = true;
    }

    const orderHistory = await this.orderHistoryRepository.find({
      where: {
        customerId,
        prescriptionId: prescription.id,
        isVoid: false,
      },
      relations: ['product'],
      order: { orderedAt: 'ASC' },
    });

    const kitValidation = await this.kitValidationService.validateKitOrdering(
      prescription.id,
      customerId,
    );

    const genuineKitCount = kitValidation.genuineKits.length;
    
    // Calculate kit numbers based on delivery dates
    const deliveredKits = KitCalculator.getDeliveredKitNumbers(
      orderHistory.filter((order) => !order.isFreeKit),
      prescription.planStartedAt,
      30, // Default 30 days per kit
    );
    const deliveredKitCount = deliveredKits.size;

    if (genuineKitCount >= requiredKits) {
      checks.purchasedCompleteKits = true;
    } else {
      reasons.push(
        `Customer has only ${genuineKitCount} genuine kits (ordered at proper intervals) out of required ${requiredKits} kits. Total delivered: ${deliveredKitCount}, but ${kitValidation.invalidKits.length} were ordered outside proper timeline.`,
      );
    }

    let allEssentialProductsPurchased = true;

    if (deliveredKitCount > 0) {

      const deliveredKitNumbers = Array.from(deliveredKits).sort((a, b) => a - b);

      for (const kitNum of deliveredKitNumbers) {
        const completenessCheck = await this.checkKitCompleteness(
          prescription.id,
          kitNum,
        );

        if (!completenessCheck.isComplete) {
          allEssentialProductsPurchased = false;
          missingEssentialProducts.push({
            kitNumber: kitNum,
            products: completenessCheck.missingProducts,
          });
          reasons.push(
            `Kit ${kitNum} is missing essential products: ${completenessCheck.missingProducts.join(', ')}`,
          );
        }
      }

      if (allEssentialProductsPurchased) {
        checks.purchasedAllEssentialProducts = true;
      }
    } else {
      reasons.push('Customer has not received any kits yet.');
    }

    if (deliveredKitCount >= requiredKits) {

      // Group orders by calculated kit number and get first delivery date for each kit
      const kitGroups = KitCalculator.groupOrdersByKit(
        orderHistory.filter((o) => o.isDelivered),
        prescription.planStartedAt,
        30,
      );
      
      const kitDeliveryDates = Array.from(deliveredKits)
        .sort((a, b) => a - b)
        .slice(0, requiredKits)
        .map((kitNum) => {
          const kitOrders = kitGroups.get(kitNum) || [];
          return kitOrders.length > 0
            ? new Date(kitOrders[0].deliveredAt)
            : null;
        })
        .filter((date) => date !== null);

      if (kitDeliveryDates.length >= requiredKits) {
        const firstKitDate = kitDeliveryDates[0];
        const lastKitDate = kitDeliveryDates[requiredKits - 1];

        const monthsDiff = this.getMonthsDifference(firstKitDate, lastKitDate);

        const maxMonths =
          recommendedTreatmentPeriod === 5
            ? 6
            : recommendedTreatmentPeriod === 8
              ? 9
              : 13;

        if (monthsDiff <= maxMonths) {
          checks.kitsDeliveredInTimeframe = true;
        } else {
          reasons.push(
            `The ${requiredKits} kits were delivered over ${monthsDiff} months, which exceeds the required ${maxMonths} months timeframe.`,
          );
        }
      }
    }

    const connectedCalls = await this.hairCoachCallRepository.count({
      where: {
        customerId,
        isConnected: true,
      },
    });

    if (connectedCalls >= 3) {
      checks.completedThreeCalls = true;
    } else {
      reasons.push(
        `Customer has completed only ${connectedCalls} calls with Hair Coach. Required: 3 calls.`,
      );
    }

    if (deliveredKitCount >= requiredKits) {
      // Find orders that belong to the last required kit based on delivery date
      const kitGroups = KitCalculator.groupOrdersByKit(
        orderHistory.filter((o) => o.isDelivered && !o.isFreeKit),
        prescription.planStartedAt,
        30,
      );
      
      const lastRequiredKitOrders = kitGroups.get(requiredKits) || [];

      if (lastRequiredKitOrders.length > 0) {
        const lastKitOrderDate = new Date(lastRequiredKitOrders[0].orderedAt);
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - lastKitOrderDate.getTime()) /
            (1000 * 60 * 60 * 24),
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
      checks.purchasedAllEssentialProducts &&
      checks.kitsDeliveredInTimeframe &&
      checks.completedThreeCalls &&
      checks.raisedWithinWindow;

    return {
      isEligible,
      reasons,
      checks,
      eligibleRefundAmount,
      recommendedTreatmentPeriod,
      prescriptionId: prescription.id,
      missingEssentialProducts,
    };
  }

  async calculateEligibleRefundAmount(customerId: string): Promise<number> {

    const deliveredOrders = await this.orderHistoryRepository.find({
      where: {
        customerId,
        isDelivered: true,
        isVoid: false,
        isFreeKit: false,
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

  async getUndeliveredOrders(customerId: string): Promise<any[]> {
    const undeliveredOrders = await this.orderHistoryRepository.find({
      where: {
        customerId,
        isDelivered: false,
      },
      relations: ['prescription'],
    });

    return undeliveredOrders.map((order) => {
      // Calculate kit number if prescription has started
      let kitNumber = 0;
      if (order.prescription?.planStartedAt && order.orderedAt) {
        kitNumber = KitCalculator.calculateKitNumber(
          order.orderedAt,
          order.prescription.planStartedAt,
          30,
        );
      }

      return {
        id: order.id,
        productId: order.productId,
        kitNumber,
        amount: order.totalAmount || 0,
        orderedAt: order.orderedAt,
      };
    });
  }

  async getRefundCalculationBreakdown(customerId: string): Promise<{
    deliveredOrdersTotal: number;
    previousRefundsTotal: number;
    netRefundAmount: number;
    deliveredOrders: any[];
    previousRefunds: any[];
    undeliveredOrders: any[];
  }> {

    const deliveredOrders = await this.orderHistoryRepository.find({
      where: {
        customerId,
        isDelivered: true,
        isVoid: false,
        isFreeKit: false,
      },
      relations: ['prescription'],
    });

    const deliveredOrdersTotal = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    const refundTransactions = await this.transactionRepository.find({
      where: {
        customerId,
        isRefund: true,
        isProcessed: true,
      },
    });

    const previousRefundsTotal = refundTransactions.reduce(
      (sum, txn) => sum + Number(txn.amount),
      0,
    );

    const undeliveredOrders = await this.getUndeliveredOrders(customerId);

    const netRefundAmount = Math.max(0, deliveredOrdersTotal - previousRefundsTotal);

    return {
      deliveredOrdersTotal,
      previousRefundsTotal,
      netRefundAmount,
      deliveredOrders: deliveredOrders.map((o) => {
        // Calculate kit number based on delivery date
        let kitNumber = 0;
        if (o.prescription?.planStartedAt && o.deliveredAt) {
          kitNumber = KitCalculator.calculateKitNumber(
            o.deliveredAt,
            o.prescription.planStartedAt,
            30,
          );
        }
        
        return {
          id: o.id,
          kitNumber,
          amount: o.totalAmount,
          deliveredAt: o.deliveredAt,
        };
      }),
      previousRefunds: refundTransactions.map((r) => ({
        transactionNumber: r.transactionNumber,
        amount: r.amount,
        processedAt: r.processedAt,
        metadata: r.metadata,
      })),
      undeliveredOrders,
    };
  }

  async checkKitCompleteness(
    prescriptionId: string,
    kitNumber: number,
  ): Promise<{
    isComplete: boolean;
    prescribedProducts: string[];
    orderedProducts: string[];
    missingProducts: string[];
  }> {
    // Get all required products from prescription
    const prescribedProducts = await this.prescriptionProductRepository.find({
      where: {
        prescriptionId,
        isRequired: true,
      },
      relations: ['product'],
    });

    // Get prescription to access start date
    const prescription = await this.prescriptionRepository.findOne({
      where: { id: prescriptionId },
    });

    if (!prescription || !prescription.planStartedAt) {
      return {
        isComplete: false,
        prescribedProducts: [],
        orderedProducts: [],
        missingProducts: [],
      };
    }

    // Get all orders for this prescription
    const allOrders = await this.orderHistoryRepository.find({
      where: {
        prescriptionId,
        isVoid: false,
        isDelivered: true,
      },
      relations: ['product'],
    });

    // Filter orders that belong to this calculated kit number
    const orderedProducts = allOrders.filter((order) => {
      const calculatedKit = KitCalculator.calculateKitNumber(
        order.deliveredAt,
        prescription.planStartedAt,
        30,
      );
      return calculatedKit === kitNumber;
    });

    const prescribedProductIds = prescribedProducts.map((pp) => pp.productId);
    const orderedProductIds = orderedProducts.map((oh) => oh.productId);

    const missingProductIds = prescribedProductIds.filter(
      (id) => !orderedProductIds.includes(id),
    );

    const prescribedNames = prescribedProducts.map((pp) => pp.product.name);
    const orderedNames = orderedProducts.map((oh) => oh.product.name);
    const missingNames = prescribedProducts
      .filter((pp) => missingProductIds.includes(pp.productId))
      .map((pp) => pp.product.name);

    return {
      isComplete: missingProductIds.length === 0,
      prescribedProducts: prescribedNames,
      orderedProducts: orderedNames,
      missingProducts: missingNames,
    };
  }

  private getMonthsDifference(date1: Date, date2: Date): number {
    const yearsDiff = date2.getFullYear() - date1.getFullYear();
    const monthsDiff = date2.getMonth() - date1.getMonth();
    return yearsDiff * 12 + monthsDiff + 1;
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  async hasNonVoidCODOrders(customerId: string): Promise<boolean> {
    const codOrders = await this.orderHistoryRepository.count({
      where: {
        customerId,
        paymentMode: 'cod',
        isVoid: false,
      },
    });

    return codOrders > 0;
  }
}

