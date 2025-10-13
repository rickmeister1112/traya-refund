import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from '../entities';

@Controller('users')
export class UserController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserType)
    private userTypeRepository: Repository<UserType>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: any) {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  @Get()
  async getAllUsers(@Query('userType') userTypeCode?: string) {
    if (userTypeCode) {
      const userType = await this.userTypeRepository.findOne({
        where: { code: userTypeCode },
      });

      return await this.userRepository.find({
        where: { userTypeId: userType.id },
        relations: ['userType'],
        order: { name: 'ASC' },
      });
    }

    return await this.userRepository.find({
      relations: ['userType'],
      order: { name: 'ASC' },
    });
  }

  @Get('finance')
  async getFinanceTeam() {
    const financeType = await this.userTypeRepository.findOne({
      where: { code: 'finance_team' },
    });

    return await this.userRepository.find({
      where: { userTypeId: financeType.id, isActive: true },
      relations: ['userType'],
    });
  }

  @Get('operations')
  async getOperationsTeam() {
    const operationsType = await this.userTypeRepository.findOne({
      where: { code: 'operations' },
    });

    return await this.userRepository.find({
      where: { userTypeId: operationsType.id, isActive: true },
      relations: ['userType'],
    });
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['userType', 'assignedTickets', 'processedTickets'],
    });
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    await this.userRepository.update(id, updateData);
    return await this.userRepository.findOne({
      where: { id },
      relations: ['userType'],
    });
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {

    await this.userRepository.softDelete(id);
    await this.userRepository.update(id, { isActive: false });
    return { message: 'User soft-deleted successfully (can be restored)' };
  }

  @Post(':id/restore')
  async restoreUser(@Param('id') id: string) {
    await this.userRepository.restore(id);
    await this.userRepository.update(id, { isActive: true });
    return { message: 'User restored successfully' };
  }
}

