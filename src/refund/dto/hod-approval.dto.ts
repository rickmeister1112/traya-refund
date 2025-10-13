import { IsNotEmpty, IsBoolean, IsString } from 'class-validator';

export class HODApprovalDto {
  @IsNotEmpty()
  @IsBoolean()
  isApproved: boolean;

  @IsNotEmpty()
  @IsString()
  comments: string;

  @IsNotEmpty()
  @IsString()
  processedBy: string;
}

