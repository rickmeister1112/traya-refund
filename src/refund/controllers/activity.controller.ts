import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityTrackerService } from '../services/activity-tracker.service';
import { ActivityType } from '../enums/activity-type.enum';

@Controller('activities')
export class ActivityController {
  constructor(
    private readonly activityTrackerService: ActivityTrackerService,
  ) {}

  @Get('customer/:customerId')
  async getCustomerTimeline(
    @Param('customerId') customerId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.activityTrackerService.getCustomerTimeline(
      customerId,
      limitNum,
    );
  }

  @Get('customer/:customerId/type/:activityType')
  async getActivitiesByType(
    @Param('customerId') customerId: string,
    @Param('activityType') activityType: ActivityType,
  ) {
    return await this.activityTrackerService.getActivitiesByType(
      customerId,
      activityType,
    );
  }

  @Get('entity/:entityType/:entityId')
  async getEntityActivities(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return await this.activityTrackerService.getEntityActivities(
      entityType,
      entityId,
    );
  }

  @Get('recent')
  async getRecentActivities(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return await this.activityTrackerService.getRecentActivities(limitNum);
  }
}

