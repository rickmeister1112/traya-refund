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
import { UserType } from '../entities';

@Controller('user-types')
export class UserTypeController {
  constructor(
    @InjectRepository(UserType)
    private userTypeRepository: Repository<UserType>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUserType(@Body() createUserTypeDto: any) {
    const userType = this.userTypeRepository.create(createUserTypeDto);
    return await this.userTypeRepository.save(userType);
  }

  @Get()
  async getAllUserTypes() {
    return await this.userTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  @Get(':id')
  async getUserType(@Param('id') id: string) {
    return await this.userTypeRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  @Get('code/:code')
  async getUserTypeByCode(@Param('code') code: string) {
    return await this.userTypeRepository.findOne({
      where: { code },
      relations: ['users'],
    });
  }

  @Patch(':id')
  async updateUserType(@Param('id') id: string, @Body() updateData: any) {
    await this.userTypeRepository.update(id, updateData);
    return await this.userTypeRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteUserType(@Param('id') id: string) {

    await this.userTypeRepository.softDelete(id);
    return { message: 'User type soft-deleted successfully (can be restored)' };
  }

  @Post(':id/restore')
  async restoreUserType(@Param('id') id: string) {
    await this.userTypeRepository.restore(id);
    return { message: 'User type restored successfully' };
  }
}

