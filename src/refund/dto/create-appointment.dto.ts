import { IsNotEmpty, IsString, IsUUID, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsNotEmpty()
  @IsUUID()
  ticketId: string;

  @IsNotEmpty()
  @IsString()
  slotType: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  slotTime: Date;

  @IsNotEmpty()
  @IsString()
  assignedTo: string;
}

