import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from '../entities';
import { CreateCallLogDto } from '../dto';

@Controller('call-logs')
export class CallLogController {
  constructor(
    @InjectRepository(CallLog)
    private callLogRepository: Repository<CallLog>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCallLog(@Body() createCallLogDto: CreateCallLogDto) {
    const callLog = this.callLogRepository.create({
      ...createCallLogDto,
      callTime: new Date(),
    });
    return await this.callLogRepository.save(callLog);
  }

  @Get()
  async getAllCallLogs(
    @Query('customerId') customerId?: string,
    @Query('callType') callType?: string,
  ) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (callType) where.callType = callType;

    return await this.callLogRepository.find({
      where,
      relations: ['customer'],
      order: { callTime: 'DESC' },
    });
  }

  @Get('customer/:customerId/connected-count')
  async getConnectedCallCount(@Param('customerId') customerId: string) {
    const count = await this.callLogRepository.count({
      where: {
        customerId,
        isConnected: true,
        callType: 'hair_coach',
      },
    });

    return {
      customerId,
      connectedHairCoachCalls: count,
      meetsEligibility: count >= 3,
    };
  }
}

