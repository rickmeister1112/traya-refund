import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HairCoach, HairCoachCall, Customer } from '../entities';

@Controller('hair-coaches')
export class HairCoachController {
  constructor(
    @InjectRepository(HairCoach)
    private hairCoachRepository: Repository<HairCoach>,
    @InjectRepository(HairCoachCall)
    private hairCoachCallRepository: Repository<HairCoachCall>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createHairCoach(@Body() createData: any) {
    const coach = this.hairCoachRepository.create(createData);
    return await this.hairCoachRepository.save(coach);
  }

  @Get()
  async getAllHairCoaches() {
    return await this.hairCoachRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  @Get(':id')
  async getHairCoach(@Param('id') id: string) {
    return await this.hairCoachRepository.findOne({
      where: { id },
      relations: ['assignedCustomers', 'calls'],
    });
  }

  @Get(':id/workload')
  async getHairCoachWorkload(@Param('id') id: string) {
    const assignedCustomers = await this.customerRepository.count({
      where: { assignedHairCoachId: id },
    });

    const callsToday = await this.hairCoachCallRepository.count({
      where: {
        hairCoachId: id,
        callTime: new Date() as any,
      },
    });

    const coach = await this.hairCoachRepository.findOne({ where: { id } });

    return {
      hairCoachId: id,
      assignedCustomers,
      callsToday,
      maxDailyCustomers: coach?.maxDailyCustomers || 0,
      available: (coach?.maxDailyCustomers || 0) - assignedCustomers,
      utilizationPercent:
        ((assignedCustomers / (coach?.maxDailyCustomers || 1)) * 100).toFixed(2),
    };
  }

  @Get('available/least-loaded')
  async getLeastLoadedHairCoach() {
    const coaches = await this.hairCoachRepository.find({
      where: { isActive: true },
    });

    const coachWorkloads = await Promise.all(
      coaches.map(async (coach) => {
        const workload = await this.getHairCoachWorkload(coach.id);
        return { coach, workload };
      }),
    );

    coachWorkloads.sort((a, b) => b.workload.available - a.workload.available);

    return coachWorkloads[0]?.coach || null;
  }

  @Patch(':id')
  async updateHairCoach(@Param('id') id: string, @Body() updateData: any) {
    await this.hairCoachRepository.update(id, updateData);
    return await this.hairCoachRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteHairCoach(@Param('id') id: string) {

    await this.hairCoachRepository.softDelete(id);
    return { message: 'Hair Coach soft-deleted successfully (can be restored)' };
  }

  @Post(':id/restore')
  async restoreHairCoach(@Param('id') id: string) {
    await this.hairCoachRepository.restore(id);
    return { message: 'Hair Coach restored successfully' };
  }

  @Post(':hairCoachId/calls')
  @HttpCode(HttpStatus.CREATED)
  async logCall(
    @Param('hairCoachId') hairCoachId: string,
    @Body()
    callData: {
      customerId: string;
      callPurpose: string;
      status: string;
      isConnected: boolean;
      duration?: number;
      summary?: string;
      engagementId?: string;
    },
  ) {
    const call = this.hairCoachCallRepository.create({
      hairCoachId,
      customerId: callData.customerId,
      callPurpose: callData.callPurpose,
      status: callData.status as any,
      isConnected: callData.isConnected,
      duration: callData.duration,
      summary: callData.summary,
      engagementId: callData.engagementId,
      callTime: new Date(),
    });

    return await this.hairCoachCallRepository.save(call);
  }

  @Get(':hairCoachId/calls')
  async getHairCoachCalls(@Param('hairCoachId') hairCoachId: string) {
    return await this.hairCoachCallRepository.find({
      where: { hairCoachId },
      relations: ['customer'],
      order: { callTime: 'DESC' },
    });
  }

  @Get('calls/customer/:customerId')
  async getCustomerHairCoachCalls(@Param('customerId') customerId: string) {
    return await this.hairCoachCallRepository.find({
      where: { customerId },
      relations: ['hairCoach'],
      order: { callTime: 'DESC' },
    });
  }

  @Get('calls/customer/:customerId/count')
  async getConnectedCallCount(@Param('customerId') customerId: string) {
    const count = await this.hairCoachCallRepository.count({
      where: {
        customerId,
        isConnected: true,
      },
    });

    return {
      customerId,
      connectedHairCoachCalls: count,
      meetsEligibility: count >= 3,
      required: 3,
    };
  }
}

