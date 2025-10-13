import { IsNotEmpty, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCallAttemptDto {
  @IsNotEmpty()
  @IsBoolean()
  isConnected: boolean;

  @IsNotEmpty()
  @IsNumber()
  attemptNumber: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

