import { Controller, Get, Param, Post } from '@nestjs/common';
import { PrescriptionTrackerService } from '../services/prescription-tracker.service';

@Controller('prescription-tracker')
export class PrescriptionTrackerController {
  constructor(
    private readonly prescriptionTrackerService: PrescriptionTrackerService,
  ) {}

  @Get(':prescriptionId/timeline')
  async getTimeline(@Param('prescriptionId') prescriptionId: string) {
    return await this.prescriptionTrackerService.getPrescriptionTimeline(
      prescriptionId,
    );
  }

  @Get(':prescriptionId/on-track')
  async checkOnTrack(@Param('prescriptionId') prescriptionId: string) {
    return await this.prescriptionTrackerService.isCustomerOnTrack(
      prescriptionId,
    );
  }

  @Post(':prescriptionId/update-dates')
  async updateDates(@Param('prescriptionId') prescriptionId: string) {
    await this.prescriptionTrackerService.updatePrescriptionDates(
      prescriptionId,
    );
    return {
      message: 'Prescription dates updated successfully',
    };
  }
}

