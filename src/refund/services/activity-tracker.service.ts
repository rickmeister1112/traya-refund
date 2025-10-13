import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerActivity } from '../entities/customer-activity.entity';
import { ActivityType } from '../enums/activity-type.enum';

export interface LogActivityDto {
  customerId: string;
  activityType: ActivityType;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  performedByUserId?: string;
  performedBy?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityTrackerService {
  constructor(
    @InjectRepository(CustomerActivity)
    private activityRepository: Repository<CustomerActivity>,
  ) {}

  async logActivity(data: LogActivityDto): Promise<CustomerActivity> {
    const activity = this.activityRepository.create({
      customerId: data.customerId,
      activityType: data.activityType,
      title: data.title,
      description: data.description,
      entityType: data.entityType,
      entityId: data.entityId,
      performedByUserId: data.performedByUserId,
      performedBy: data.performedBy || 'system',
      oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
      newValue: data.newValue ? JSON.stringify(data.newValue) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return await this.activityRepository.save(activity);
  }

  async logPrescriptionCreated(
    customerId: string,
    prescriptionId: string,
    kitId: string,
    planType: string,
    doctorId?: string,
  ): Promise<CustomerActivity> {
    return await this.logActivity({
      customerId,
      activityType: ActivityType.PRESCRIPTION_CREATED,
      title: 'Prescription Created',
      description: `New ${planType} prescription created with Kit ID: ${kitId}`,
      entityType: 'prescription',
      entityId: prescriptionId,
      performedByUserId: doctorId,
      performedBy: 'doctor',
      newValue: { kitId, planType, prescriptionId },
    });
  }

  async logKitChanged(
    customerId: string,
    prescriptionId: string,
    oldKitId: string,
    newKitId: string,
    oldPlanType: string,
    newPlanType: string,
    reason: string,
    changedBy: string,
    changedByUserId?: string,
  ): Promise<CustomerActivity> {
    return await this.logActivity({
      customerId,
      activityType: ActivityType.KIT_CHANGED,
      title: 'Kit Plan Changed',
      description: `Kit changed from ${oldKitId} (${oldPlanType}) to ${newKitId} (${newPlanType}). Reason: ${reason}`,
      entityType: 'prescription',
      entityId: prescriptionId,
      performedByUserId: changedByUserId,
      performedBy: changedBy,
      oldValue: { kitId: oldKitId, planType: oldPlanType },
      newValue: { kitId: newKitId, planType: newPlanType },
      metadata: { reason },
    });
  }

  async logTimelineUpdated(
    customerId: string,
    prescriptionId: string,
    oldTimeline: any,
    newTimeline: any,
    reason: string,
  ): Promise<CustomerActivity> {
    return await this.logActivity({
      customerId,
      activityType: ActivityType.TIMELINE_UPDATED,
      title: 'Treatment Timeline Updated',
      description: `Timeline updated. ${reason}`,
      entityType: 'prescription',
      entityId: prescriptionId,
      performedBy: 'system',
      oldValue: oldTimeline,
      newValue: newTimeline,
      metadata: { reason },
    });
  }

  async logRefundRequested(
    customerId: string,
    ticketId: string,
    amount: number,
    source: string,
  ): Promise<CustomerActivity> {
    return await this.logActivity({
      customerId,
      activityType: ActivityType.REFUND_REQUESTED,
      title: 'Refund Request Raised',
      description: `Customer requested refund of ₹${amount} via ${source}`,
      entityType: 'ticket',
      entityId: ticketId,
      performedBy: 'customer',
      newValue: { amount, source, ticketId },
    });
  }

  async getCustomerTimeline(
    customerId: string,
    limit: number = 50,
  ): Promise<CustomerActivity[]> {
    return await this.activityRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['performedByUser'],
    });
  }

  async getActivitiesByType(
    customerId: string,
    activityType: ActivityType,
  ): Promise<CustomerActivity[]> {
    return await this.activityRepository.find({
      where: { customerId, activityType },
      order: { createdAt: 'DESC' },
    });
  }

  async getEntityActivities(
    entityType: string,
    entityId: string,
  ): Promise<CustomerActivity[]> {
    return await this.activityRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRecentActivities(limit: number = 100): Promise<CustomerActivity[]> {
    return await this.activityRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['customer', 'performedByUser'],
    });
  }
}

