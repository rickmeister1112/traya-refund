import { IsNotEmpty, IsUUID, IsNumber, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @IsNotEmpty()
  @IsArray()
  products: any[];

  @IsNotEmpty()
  @IsNumber()
  treatmentDurationMonths: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

