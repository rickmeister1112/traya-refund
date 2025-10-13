import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderHistory, PrescriptionProduct } from '../entities';

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
  ) {}

  async validateKitOrdering(
    prescriptionId: string,
    customerId: string,
  ): Promise<{
    genuineKits: number[];
    invalidKits: number[];
    validationDetails: KitValidationResult[];
  }> {

    const orders = await this.orderHistoryRepository.find({
      where: {
        prescriptionId,
        customerId,
        isVoid: false,
        isDelivered: true,
      },
      order: { deliveredAt: 'ASC' },
    });

    const prescriptionProducts = await this.prescriptionProductRepository.find({
      where: { prescriptionId },
      order: { kitNumber: 'ASC' },
    });

    const kitExhaustionDays = this.calculateKitExhaustionDays(prescriptionProducts);

    const kitOrders = new Map<number, Date>();
    orders.forEach((order) => {
      if (!kitOrders.has(order.kitNumber)) {
        kitOrders.set(order.kitNumber, new Date(order.deliveredAt));
      }
    });

    const firstKitDate = kitOrders.get(1);
    if (!firstKitDate) {
      return {
        genuineKits: [],
        invalidKits: [],
        validationDetails: [],
      };
    }

    const validationDetails: KitValidationResult[] = [];
    const genuineKits: number[] = [];
    const invalidKits: number[] = [];

    kitOrders.forEach((actualOrderDate, kitNumber) => {
      if (kitNumber === 1) {

        genuineKits.push(1);
        validationDetails.push({
          kitNumber: 1,
          isGenuine: true,
          expectedOrderDate: firstKitDate,
          actualOrderDate: firstKitDate,
          daysEarly: 0,
          daysLate: 0,
          isWithinWindow: true,
        });
        return;
      }

      const expectedDate = new Date(firstKitDate);
      expectedDate.setDate(
        expectedDate.getDate() + (kitNumber - 1) * kitExhaustionDays,
      );

      const daysDiff = this.getDaysDifference(expectedDate, actualOrderDate);
      const daysEarly = daysDiff < 0 ? Math.abs(daysDiff) : 0;
      const daysLate = daysDiff > 0 ? daysDiff : 0;

      const isWithinWindow = Math.abs(daysDiff) <= 7;

      const result: KitValidationResult = {
        kitNumber,
        isGenuine: isWithinWindow,
        expectedOrderDate: expectedDate,
        actualOrderDate,
        daysEarly,
        daysLate,
        isWithinWindow,
      };

      if (isWithinWindow) {
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

