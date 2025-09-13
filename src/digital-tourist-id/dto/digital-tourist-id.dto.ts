import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class PersonalDataDto {
  @ApiProperty({ description: 'Tourist full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'National ID number', required: false })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiProperty({ description: 'Passport number', required: false })
  @IsString()
  @IsOptional()
  passport?: string;

  @ApiProperty({ description: 'Nationality' })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class BookingDataDto {
  @ApiProperty({ description: 'Hotel name', required: false })
  @IsString()
  @IsOptional()
  hotelName?: string;

  @ApiProperty({ description: 'Check-in date', required: false })
  @IsString()
  @IsOptional()
  checkInDate?: string;

  @ApiProperty({ description: 'Check-out date', required: false })
  @IsString()
  @IsOptional()
  checkOutDate?: string;
}

export class EmergencyContactsDto {
  @ApiProperty({ description: 'Primary emergency contact' })
  @IsString()
  @IsNotEmpty()
  primary: string;

  @ApiProperty({ description: 'Secondary emergency contact', required: false })
  @IsString()
  @IsOptional()
  secondary?: string;
}

export class ConsentSettingsDto {
  @ApiProperty({ description: 'Police access permission' })
  @IsBoolean()
  POLICE_ACCESS: boolean;

  @ApiProperty({ description: 'Hotel access permission' })
  @IsBoolean()
  HOTEL_ACCESS: boolean;

  @ApiProperty({ description: 'Family access permission' })
  @IsBoolean()
  FAMILY_ACCESS: boolean;

  @ApiProperty({ description: 'Tourism department access permission' })
  @IsBoolean()
  TOURISM_DEPT_ACCESS: boolean;
}

export class IssueDigitalIdDto {
  @ApiProperty({ description: 'Unique tourist ID' })
  @IsString()
  @IsNotEmpty()
  touristId: string;

  @ApiProperty({ description: 'Tourist wallet address' })
  @IsString()
  @IsNotEmpty()
  touristWallet: string;

  @ApiProperty({ description: 'Personal data', type: PersonalDataDto })
  @ValidateNested()
  @Type(() => PersonalDataDto)
  personalData: PersonalDataDto;

  @ApiProperty({ description: 'Booking data', type: BookingDataDto, required: false })
  @ValidateNested()
  @Type(() => BookingDataDto)
  @IsOptional()
  bookingData?: BookingDataDto;

  @ApiProperty({ description: 'Emergency contacts', type: EmergencyContactsDto })
  @ValidateNested()
  @Type(() => EmergencyContactsDto)
  emergencyContacts: EmergencyContactsDto;

  @ApiProperty({ description: 'Biometric data hash', required: false })
  @IsString()
  @IsOptional()
  biometricData?: string;

  @ApiProperty({ description: 'Validity period in days', minimum: 1, maximum: 365 })
  @IsNumber()
  @Min(1)
  @Max(365)
  validityDays: number;

  @ApiProperty({ description: 'Checkout timestamp', required: false })
  @IsNumber()
  @IsOptional()
  checkoutTimestamp?: number;

  @ApiProperty({ description: 'Initial consent settings', type: ConsentSettingsDto, required: false })
  @ValidateNested()
  @Type(() => ConsentSettingsDto)
  @IsOptional()
  initialConsent?: ConsentSettingsDto;
}

export class AccessDigitalIdDto {
  @ApiProperty({ description: 'Blockchain ID of the Digital Tourist ID' })
  @IsString()
  @IsNotEmpty()
  blockchainId: string;

  @ApiProperty({ description: 'Reason for accessing the ID' })
  @IsString()
  @IsNotEmpty()
  accessReason: string;

  @ApiProperty({ description: 'Emergency access flag', required: false })
  @IsBoolean()
  @IsOptional()
  emergencyAccess?: boolean;
}

export class UpdateConsentDto {
  @ApiProperty({ description: 'Updated consent settings', type: ConsentSettingsDto })
  @ValidateNested()
  @Type(() => ConsentSettingsDto)
  consentSettings: ConsentSettingsDto;
}

export class ReportLostIdDto {
  @ApiProperty({ description: 'Blockchain ID of the lost Digital Tourist ID' })
  @IsString()
  @IsNotEmpty()
  blockchainId: string;

  @ApiProperty({ description: 'Reason for reporting as lost' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Kiosk location where replacement is issued', required: false })
  @IsString()
  @IsOptional()
  kioskLocation?: string;

  @ApiProperty({ description: 'New wallet address for replacement ID', required: false })
  @IsString()
  @IsOptional()
  newWalletAddress?: string;
}

export class EmergencyAccessDto {
  @ApiProperty({ description: 'Blockchain ID of the Digital Tourist ID' })
  @IsString()
  @IsNotEmpty()
  blockchainId: string;

  @ApiProperty({ description: 'Emergency access reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Emergency responder wallet address' })
  @IsString()
  @IsNotEmpty()
  emergencyResponderAddress: string;
}

export class AccessLogDto {
  @ApiProperty({ description: 'Access timestamp' })
  timestamp: number;

  @ApiProperty({ description: 'Accessor ID' })
  accessorId: string;

  @ApiProperty({ description: 'Accessor role' })
  accessorRole: string;

  @ApiProperty({ description: 'Access reason' })
  accessReason: string;

  @ApiProperty({ description: 'Emergency access flag' })
  emergencyAccess: boolean;

  @ApiProperty({ description: 'Transaction hash' })
  transactionHash: string;

  @ApiProperty({ description: 'Data accessed' })
  dataAccessed: string[];
}

export class DigitalIdResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Blockchain ID', required: false })
  blockchainId?: string;

  @ApiProperty({ description: 'Transaction hash', required: false })
  transactionHash?: string;

  @ApiProperty({ description: 'Digital ID data', required: false })
  digitalId?: any;

  @ApiProperty({ description: 'Access levels granted', required: false })
  accessLevels?: any;

  @ApiProperty({ description: 'Expiration timestamp', required: false })
  expiresAt?: number;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Error details', required: false })
  error?: string;
}

export class BlockchainEventDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({ description: 'Blockchain ID', required: false })
  @IsString()
  @IsOptional()
  blockchainId?: string;

  @ApiProperty({ description: 'Tourist ID', required: false })
  @IsString()
  @IsOptional()
  touristId?: string;

  @ApiProperty({ description: 'Transaction hash', required: false })
  @IsString()
  @IsOptional()
  transactionHash?: string;

  @ApiProperty({ description: 'Event metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class AnalyticsSummaryDto {
  @ApiProperty({ description: 'Total Digital IDs issued' })
  totalIds: number;

  @ApiProperty({ description: 'Active Digital IDs' })
  activeIds: number;

  @ApiProperty({ description: 'Expired Digital IDs' })
  expiredIds: number;

  @ApiProperty({ description: 'Revoked Digital IDs' })
  revokedIds: number;

  @ApiProperty({ description: 'Emergency overrides active' })
  emergencyOverrides: number;

  @ApiProperty({ description: 'Digital IDs issued today' })
  todayIssuedIds: number;

  @ApiProperty({ description: 'Access statistics' })
  accessStats: {
    totalAccesses: number;
    averagePerDay: number;
    emergencyAccesses: number;
  };

  @ApiProperty({ description: 'Top accessed Digital IDs' })
  topAccessedIds: {
    blockchainId: string;
    touristName: string;
    accessCount: number;
  }[];

  @ApiProperty({ description: 'Consent distribution' })
  consentDistribution: {
    policeAccess: number;
    hotelAccess: number;
    familyAccess: number;
    tourismAccess: number;
  };

  @ApiProperty({ description: 'Recent blockchain events' })
  recentEvents: BlockchainEventDto[];
}