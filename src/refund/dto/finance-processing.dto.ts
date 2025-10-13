import { IsNotEmpty, IsBoolean, IsString, IsOptional } from 'class-validator';

export class FinanceProcessingDto {
  @IsNotEmpty()
  @IsBoolean()
  isProcessed: boolean;

  @IsNotEmpty()
  @IsString()
  comments: string;

  @IsNotEmpty()
  @IsString()
  processedBy: string;

  @IsString()
  @IsOptional()
  transactionNumber?: string;

  @IsString()
  @IsOptional()
  paymentGatewayTransactionId?: string;

  @IsString()
  @IsOptional()
  bankAccountNumber?: string;
}

