import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerPrescription, OrderHistory } from '../entities';
import { ActivityTrackerService } from './activity-tracker.service';
import { PrescriptionTrackerService } from './prescription-tracker.service';

@Injectable()
export class KitManagementService {
  constructor(
    @InjectRepository(CustomerPrescription)
    private prescriptionRepository: Repository<CustomerPrescription>,
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    private activityTrackerService: ActivityTrackerService,
    private prescriptionTrackerService: PrescriptionTrackerService,
  ) {}

  generateKitId(planType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    let prefix = 'KIT';
    if (planType.includes('5_month')) {
      prefix = 'KIT-5M';
    } else if (planType.includes('8_month')) {
      prefix = 'KIT-8M';
    } else if (planType.includes('12_month')) {
      prefix = 'KIT-12M';
    }

    return `${prefix}-${timestamp}-${random}`;
  }

  async changeKit(
    customerId: string,
    newPlanType: string,
    newTreatmentDurationMonths: number,
    newRequiredKits: number,
    reason: string,
    changedBy: string,
    changedByUserId?: string,
  ): Promise<CustomerPrescription> {

    const currentPrescription = await this.prescriptionRepository.findOne({
      where: { customerId, isActive: true },
    });

    if (!currentPrescription) {
      throw new NotFoundException('No active prescription found for customer');
    }

    const deliveredOrders = await this.orderHistoryRepository.find({
      where: {
        prescriptionId: currentPrescription.id,
        isDelivered: true,
        isVoid: false,
      },
    });

    if (deliveredOrders.length > 0) {
      throw new BadRequestException(
        `Cannot change kit. Customer has already received ${deliveredOrders.length} orders. Please create a new prescription instead.`,
      );
    }

    const oldKitId = currentPrescription.kitId;
    const oldPlanType = currentPrescription.planType;
    const oldTreatmentDuration = currentPrescription.treatmentDurationMonths;
    const oldRequiredKits = currentPrescription.requiredKits;

    const newKitId = this.generateKitId(newPlanType);

    currentPrescription.kitId = newKitId;
    currentPrescription.planType = newPlanType;
    currentPrescription.treatmentDurationMonths = newTreatmentDurationMonths;
    currentPrescription.requiredKits = newRequiredKits;

    currentPrescription.planStartedAt = null;
    currentPrescription.expectedCompletionDate = null;
    currentPrescription.actualCompletionDate = null;

    await this.prescriptionRepository.save(currentPrescription);

    await this.activityTrackerService.logKitChanged(
      customerId,
      currentPrescription.id,
      oldKitId,
      newKitId,
      oldPlanType,
      newPlanType,
      reason,
      changedBy,
      changedByUserId,
    );

    await this.activityTrackerService.logTimelineUpdated(
      customerId,
      currentPrescription.id,
      {
        kitId: oldKitId,
        planType: oldPlanType,
        treatmentDurationMonths: oldTreatmentDuration,
        requiredKits: oldRequiredKits,
      },
      {
        kitId: newKitId,
        planType: newPlanType,
        treatmentDurationMonths: newTreatmentDurationMonths,
        requiredKits: newRequiredKits,
      },
      `Kit changed from ${oldPlanType} to ${newPlanType}`,
    );

    return currentPrescription;
  }

  async createPrescriptionWithKit(
    customerId: string,
    planType: string,
    treatmentDurationMonths: number,
    requiredKits: number,
    prescribedByDoctorId?: string,
  ): Promise<CustomerPrescription> {

    await this.prescriptionRepository.update(
      { customerId, isActive: true },
      { isActive: false },
    );

    const kitId = this.generateKitId(planType);

    const prescriptionNumber = `PRX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const prescription = this.prescriptionRepository.create({
      prescriptionNumber,
      kitId,
      customerId,
      prescribedByDoctorId,
      planType,
      treatmentDurationMonths,
      requiredKits,
      isActive: true,
      prescribedAt: new Date(),
    });

    const savedPrescription = await this.prescriptionRepository.save(prescription);

    await this.activityTrackerService.logPrescriptionCreated(
      customerId,
      savedPrescription.id,
      kitId,
      planType,
      prescribedByDoctorId,
    );

    return savedPrescription;
  }

  async getPrescriptionByKitId(kitId: string): Promise<CustomerPrescription> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { kitId },
      relations: ['customer', 'prescribedByDoctor', 'prescribedProducts'],
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with Kit ID ${kitId} not found`);
    }

    return prescription;
  }

  async getCustomerKitInfo(customerId: string): Promise<{
    kitId: string;
    planType: string;
    treatmentDurationMonths: number;
    requiredKits: number;
    prescriptionNumber: string;
    prescribedAt: Date;
    planStartedAt: Date | null;
    expectedCompletionDate: Date | null;
    isActive: boolean;
  }> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { customerId, isActive: true },
    });

    if (!prescription) {
      throw new NotFoundException('No active prescription found for customer');
    }

    return {
      kitId: prescription.kitId,
      planType: prescription.planType,
      treatmentDurationMonths: prescription.treatmentDurationMonths,
      requiredKits: prescription.requiredKits,
      prescriptionNumber: prescription.prescriptionNumber,
      prescribedAt: prescription.prescribedAt,
      planStartedAt: prescription.planStartedAt,
      expectedCompletionDate: prescription.expectedCompletionDate,
      isActive: prescription.isActive,
    };
  }
}

