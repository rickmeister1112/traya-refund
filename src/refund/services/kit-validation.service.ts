import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderHistory, PrescriptionProduct, CustomerPrescription } from '../entities';
import { KitCalculator } from '../utils/kit-calculator.util';

export interface KitValidationResult {
  kitNumber: number;
  isGenuine: boolean;
  expectedOrderDate: Date;
  actualOrderDate: Date;
  daysEarly: number;
  daysLate: number;
  isWithinWindow: boolean;
}

@Injectable()
export class KitValidationService {
  constructor(
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(PrescriptionProduct)
    private prescriptionProductRepository: Repository<PrescriptionProduct>,
    @InjectRepository(CustomerPrescription)
    private prescriptionRepository: Repository<CustomerPrescription>,
  ) {}

  async validateKitOrdering(
    prescriptionId: string,
    customerId: string,
  ): Promise<{
    genuineKits: number[];
    invalidKits: number[];
    validationDetails: KitValidationResult[];
  }> {
    // Get prescription to access plan start date
    const prescription = await this.prescriptionRepository.findOne({
      where: { id: prescriptionId },
    });

    if (!prescription || !prescription.planStartedAt) {
      return {
        genuineKits: [],
        invalidKits: [],
        validationDetails: [],
      };
    }

    const orders = await this.orderHistoryRepository.find({
      where: {
        prescriptionId,
        customerId,
        isVoid: false,
        isDelivered: true,
      },
      order: { deliveredAt: 'ASC' },
    });

    if (orders.length === 0) {
      return {
        genuineKits: [],
        invalidKits: [],
        validationDetails: [],
      };
    }

    const prescriptionProducts = await this.prescriptionProductRepository.find({
      where: { prescriptionId },
    });

    const kitExhaustionDays = this.calculateKitExhaustionDays(prescriptionProducts);

    // Group orders by calculated kit number
    const kitOrders = KitCalculator.groupOrdersByKit(
      orders,
      prescription.planStartedAt,
      kitExhaustionDays,
    );

    const firstKitDate = prescription.planStartedAt;

    const validationDetails: KitValidationResult[] = [];
    const genuineKits: number[] = [];
    const invalidKits: number[] = [];

    kitOrders.forEach((kitOrdersList, kitNumber) => {
      // Get the first order for this kit (earliest delivery)
      const actualOrderDate = new Date(kitOrdersList[0].deliveredAt);
      
      // Use KitCalculator to check if order is on time
      const validationCheck = KitCalculator.isOrderOnTime(
        actualOrderDate,
        prescription.planStartedAt,
        kitNumber,
        kitExhaustionDays,
        5, // allowedDaysEarly
        7, // allowedDaysLate
      );

      const daysEarly = validationCheck.daysDifference < 0 ? Math.abs(validationCheck.daysDifference) : 0;
      const daysLate = validationCheck.daysDifference > 0 ? validationCheck.daysDifference : 0;

      const result: KitValidationResult = {
        kitNumber,
        isGenuine: validationCheck.isOnTime,
        expectedOrderDate: validationCheck.expectedDate,
        actualOrderDate,
        daysEarly,
        daysLate,
        isWithinWindow: validationCheck.isOnTime,
      };

      if (validationCheck.isOnTime) {
        genuineKits.push(kitNumber);
      } else {
        invalidKits.push(kitNumber);
      }

      validationDetails.push(result);
    });

    return {
      genuineKits,
      invalidKits,
      validationDetails,
    };
  }

  private calculateKitExhaustionDays(
    prescriptionProducts: PrescriptionProduct[],
  ): number {
    if (prescriptionProducts.length === 0) return 30;

    const totalDays = prescriptionProducts.reduce(
      (sum, pp) => sum + (pp.daysToExhaust || 30),
      0,
    );
    return Math.floor(totalDays / prescriptionProducts.length);
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
  }

  async getGenuineKitsCount(
    prescriptionId: string,
    customerId: string,
  ): Promise<number> {
    const validation = await this.validateKitOrdering(
      prescriptionId,
      customerId,
    );
    return validation.genuineKits.length;
  }
}

