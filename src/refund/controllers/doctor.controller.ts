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
import { Doctor } from '../entities';

@Controller('doctors')
export class DoctorController {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDoctor(@Body() createDoctorDto: any) {
    const doctor = this.doctorRepository.create(createDoctorDto);
    return await this.doctorRepository.save(doctor);
  }

  @Get()
  async getAllDoctors() {
    return await this.doctorRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  @Get(':id')
  async getDoctor(@Param('id') id: string) {
    return await this.doctorRepository.findOne({
      where: { id },
      relations: ['assignedTickets', 'processedTickets'],
    });
  }

  @Get(':id/workload')
  async getDoctorWorkload(@Param('id') id: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignedToday = await this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.assignedTickets', 'ticket')
      .where('doctor.id = :id', { id })
      .andWhere('DATE(ticket.createdAt) = CURDATE()')
      .getCount();

    const doctor = await this.doctorRepository.findOne({ where: { id } });

    return {
      doctorId: id,
      assignedToday,
      maxDailySlots: doctor?.maxDailySlots || 0,
      available: (doctor?.maxDailySlots || 0) - assignedToday,
      utilizationPercent:
        ((assignedToday / (doctor?.maxDailySlots || 1)) * 100).toFixed(2),
    };
  }

  @Get('available/least-loaded')
  async getLeastLoadedDoctor() {
    const doctors = await this.doctorRepository.find({
      where: { isActive: true, isHOD: false },
    });

    const doctorWorkloads = await Promise.all(
      doctors.map(async (doctor) => {
        const workload = await this.getDoctorWorkload(doctor.id);
        return { doctor, workload };
      }),
    );

    doctorWorkloads.sort((a, b) => b.workload.available - a.workload.available);

    return doctorWorkloads[0]?.doctor || null;
  }

  @Patch(':id')
  async updateDoctor(@Param('id') id: string, @Body() updateData: any) {
    await this.doctorRepository.update(id, updateData);
    return await this.doctorRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteDoctor(@Param('id') id: string) {

    await this.doctorRepository.softDelete(id);
    await this.doctorRepository.update(id, { isActive: false });
    return { message: 'Doctor soft-deleted successfully (can be restored)' };
  }

  @Post(':id/restore')
  async restoreDoctor(@Param('id') id: string) {
    await this.doctorRepository.restore(id);
    await this.doctorRepository.update(id, { isActive: true });
    return { message: 'Doctor restored successfully' };
  }
}

