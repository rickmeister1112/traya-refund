import { IsNotEmpty, IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { TicketSource } from '../enums';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsNotEmpty()
  @IsEnum(TicketSource)
  source: TicketSource;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  raisedBy?: string;

  @IsOptional()
  @IsString()
  engagementId?: string;
}

