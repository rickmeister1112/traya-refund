import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateBankDetailsDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsNotEmpty()
  @IsString()
  accountHolderName: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  ifscCode: string;

  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsOptional()
  @IsString()
  branchName?: string;
}

