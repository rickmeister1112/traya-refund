import { IsNotEmpty, IsBoolean, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { RejectionReason } from '../enums';

export class DoctorDispositionDto {
  @IsNotEmpty()
  @IsBoolean()
  isApproved: boolean;

  @IsOptional()
  @IsEnum(RejectionReason)
  rejectionReason?: RejectionReason;

  @IsNotEmpty()
  @IsString()
  comments: string;

  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  @IsOptional()
  @IsNumber()
  freeKitsOffered?: number;

  @IsNotEmpty()
  @IsString()
  processedBy: string;
}

