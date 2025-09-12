import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum UserRole {
  TOURIST = 'TOURIST',
  ADMIN = 'ADMIN',
}

export class CreateTouristDto {
  @ApiProperty({ description: 'Tourist email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Password for account', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Emergency contact number', required: false })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({ description: 'Passport number', required: false })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiProperty({ description: 'Nationality', required: false })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ description: 'User role', enum: UserRole, default: UserRole.TOURIST })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
