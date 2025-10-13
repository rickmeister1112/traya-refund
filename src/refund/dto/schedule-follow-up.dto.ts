import { IsNotEmpty, IsString, IsUUID, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleFollowUpDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  slotType: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  slotTime: Date;

  @IsNotEmpty()
  @IsString()
  callPurpose: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsUUID()
  assignedToAgentId?: string;

  @IsOptional()
  @IsUUID()
  assignedToDoctorId?: string;

  @IsOptional()
  @IsUUID()
  assignedToHairCoachId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

