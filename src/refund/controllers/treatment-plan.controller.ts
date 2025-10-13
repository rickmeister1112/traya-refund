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
import { TreatmentPlan } from '../entities/treatment-plan.entity';

@Controller('treatment-plans')
export class TreatmentPlanController {
  constructor(
    @InjectRepository(TreatmentPlan)
    private treatmentPlanRepository: Repository<TreatmentPlan>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() createPlanDto: any) {
    const plan = this.treatmentPlanRepository.create(createPlanDto);
    return await this.treatmentPlanRepository.save(plan);
  }

  @Get()
  async getAllPlans() {
    return await this.treatmentPlanRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  @Get(':id')
  async getPlan(@Param('id') id: string) {
    return await this.treatmentPlanRepository.findOne({ where: { id } });
  }

  @Get('code/:code')
  async getPlanByCode(@Param('code') code: string) {
    return await this.treatmentPlanRepository.findOne({
      where: { planCode: code },
    });
  }

  @Patch(':id')
  async updatePlan(@Param('id') id: string, @Body() updateData: any) {
    await this.treatmentPlanRepository.update(id, updateData);
    return await this.treatmentPlanRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deletePlan(@Param('id') id: string) {
    await this.treatmentPlanRepository.softDelete(id);
    return { message: 'Treatment plan deactivated successfully' };
  }
}

