import { IsNotEmpty, IsString, IsUUID, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { CallStatus } from '../enums';

export class CreateCallLogDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsString()
  engagementId?: string;

  @IsNotEmpty()
  @IsString()
  callType: string;

  @IsNotEmpty()
  @IsEnum(CallStatus)
  status: CallStatus;

  @IsOptional()
  @IsString()
  calledBy?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsBoolean()
  isConnected: boolean;
}

