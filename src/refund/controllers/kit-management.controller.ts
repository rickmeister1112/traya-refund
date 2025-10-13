import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { KitManagementService } from '../services/kit-management.service';

@Controller('kit-management')
export class KitManagementController {
  constructor(
    private readonly kitManagementService: KitManagementService,
  ) {}

  @Get('customer/:customerId/current')
  async getCustomerKitInfo(@Param('customerId') customerId: string) {
    return await this.kitManagementService.getCustomerKitInfo(customerId);
  }

  @Get('kit/:kitId')
  async getPrescriptionByKitId(@Param('kitId') kitId: string) {
    return await this.kitManagementService.getPrescriptionByKitId(kitId);
  }

  @Post('customer/:customerId/change-kit')
  async changeKit(
    @Param('customerId') customerId: string,
    @Body()
    data: {
      newPlanType: string;
      newTreatmentDurationMonths: number;
      newRequiredKits: number;
      reason: string;
      changedBy: string;
      changedByUserId?: string;
    },
  ) {
    return await this.kitManagementService.changeKit(
      customerId,
      data.newPlanType,
      data.newTreatmentDurationMonths,
      data.newRequiredKits,
      data.reason,
      data.changedBy,
      data.changedByUserId,
    );
  }

  @Post('prescription/create')
  async createPrescription(
    @Body()
    data: {
      customerId: string;
      planType: string;
      treatmentDurationMonths: number;
      requiredKits: number;
      prescribedByDoctorId?: string;
    },
  ) {
    return await this.kitManagementService.createPrescriptionWithKit(
      data.customerId,
      data.planType,
      data.treatmentDurationMonths,
      data.requiredKits,
      data.prescribedByDoctorId,
    );
  }
}

