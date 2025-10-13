import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerPrescription, OrderHistory } from '../entities';

@Injectable()
export class PrescriptionTrackerService {
  constructor(
    @InjectRepository(CustomerPrescription)
    private prescriptionRepository: Repository<CustomerPrescription>,
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
  ) {}

  async updatePrescriptionDates(prescriptionId: string): Promise<void> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      return;
    }

    const deliveredOrders = await this.orderHistoryRepository.find({
      where: {
        prescriptionId,
        isDelivered: true,
        isVoid: false,
        isFreeKit: false,
      },
      order: { deliveredAt: 'ASC' },
    });

    if (deliveredOrders.length === 0) {
      return;
    }

    const deliveredKits = new Set(deliveredOrders.map((o) => o.kitNumber));
    const deliveredKitCount = deliveredKits.size;

    if (!prescription.planStartedAt) {
      const firstDelivery = deliveredOrders[0].deliveredAt;
      prescription.planStartedAt = firstDelivery;

      const expectedDate = new Date(firstDelivery);
      expectedDate.setMonth(
        expectedDate.getMonth() + prescription.treatmentDurationMonths,
      );
      prescription.expectedCompletionDate = expectedDate;
    }

    if (deliveredKitCount >= prescription.requiredKits) {

      const requiredKitNumbers = Array.from(deliveredKits)
        .sort((a, b) => a - b)
        .slice(0, prescription.requiredKits);

      const lastRequiredKitOrders = deliveredOrders.filter((o) =>
        requiredKitNumbers.includes(o.kitNumber),
      );

      if (lastRequiredKitOrders.length > 0) {
        const lastDelivery =
          lastRequiredKitOrders[lastRequiredKitOrders.length - 1].deliveredAt;
        prescription.actualCompletionDate = lastDelivery;

        if (!prescription.completedAt) {
          prescription.completedAt = lastDelivery;
          prescription.isActive = false;
        }
      }
    }

    await this.prescriptionRepository.save(prescription);
  }

  async getPrescriptionTimeline(prescriptionId: string): Promise<{
    prescribedAt: Date;
    planStartedAt: Date | null;
    expectedCompletionDate: Date | null;
    actualCompletionDate: Date | null;
    completedAt: Date | null;
    treatmentDurationMonths: number;
    requiredKits: number;
    daysUntilExpectedCompletion: number | null;
    isOnTrack: boolean;
    deliveredKitsCount: number;
  }> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const deliveredOrders = await this.orderHistoryRepository.find({
      where: {
        prescriptionId,
        isDelivered: true,
        isVoid: false,
        isFreeKit: false,
      },
    });

    const deliveredKitsCount = new Set(
      deliveredOrders.map((o) => o.kitNumber),
    ).size;

    let daysUntilExpectedCompletion: number | null = null;
    let isOnTrack = true;

    if (prescription.expectedCompletionDate) {
      const today = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      daysUntilExpectedCompletion = Math.floor(
        (prescription.expectedCompletionDate.getTime() - today.getTime()) /
          msPerDay,
      );

      if (prescription.planStartedAt) {
        const totalPlanDays = Math.floor(
          (prescription.expectedCompletionDate.getTime() -
            prescription.planStartedAt.getTime()) /
            msPerDay,
        );
        const daysPassed = Math.floor(
          (today.getTime() - prescription.planStartedAt.getTime()) / msPerDay,
        );
        const expectedKitsByNow =
          (daysPassed / totalPlanDays) * prescription.requiredKits;

        isOnTrack = deliveredKitsCount >= Math.floor(expectedKitsByNow);
      }
    }

    return {
      prescribedAt: prescription.prescribedAt,
      planStartedAt: prescription.planStartedAt,
      expectedCompletionDate: prescription.expectedCompletionDate,
      actualCompletionDate: prescription.actualCompletionDate,
      completedAt: prescription.completedAt,
      treatmentDurationMonths: prescription.treatmentDurationMonths,
      requiredKits: prescription.requiredKits,
      daysUntilExpectedCompletion,
      isOnTrack,
      deliveredKitsCount,
    };
  }

  async isCustomerOnTrack(prescriptionId: string): Promise<{
    isOnTrack: boolean;
    message: string;
    expectedKits: number;
    actualKits: number;
  }> {
    const timeline = await this.getPrescriptionTimeline(prescriptionId);

    if (!timeline.planStartedAt) {
      return {
        isOnTrack: true,
        message: 'Plan has not started yet (no kits delivered)',
        expectedKits: 0,
        actualKits: 0,
      };
    }

    const today = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    if (timeline.expectedCompletionDate) {
      const totalPlanDays = Math.floor(
        (timeline.expectedCompletionDate.getTime() -
          timeline.planStartedAt.getTime()) /
          msPerDay,
      );
      const daysPassed = Math.floor(
        (today.getTime() - timeline.planStartedAt.getTime()) / msPerDay,
      );
      const percentComplete = Math.min((daysPassed / totalPlanDays) * 100, 100);
      const expectedKits = Math.floor(
        (percentComplete / 100) * timeline.requiredKits,
      );

      const isOnTrack = timeline.deliveredKitsCount >= expectedKits;

      return {
        isOnTrack,
        message: isOnTrack
          ? `Customer is on track (${timeline.deliveredKitsCount}/${expectedKits} kits expected by now)`
          : `Customer is behind schedule (${timeline.deliveredKitsCount}/${expectedKits} kits expected by now)`,
        expectedKits,
        actualKits: timeline.deliveredKitsCount,
      };
    }

    return {
      isOnTrack: true,
      message: 'Unable to determine progress',
      expectedKits: 0,
      actualKits: timeline.deliveredKitsCount,
    };
  }
}

