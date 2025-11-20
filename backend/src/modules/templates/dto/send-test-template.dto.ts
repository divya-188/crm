import { IsString, IsNotEmpty, Matches, IsObject, IsOptional, ValidateIf } from 'class-validator';

/**
 * DTO for sending test templates
 * Requirements: 12.1, 12.3, 12.4
 */
export class SendTestTemplateDto {
  /**
   * Test phone number in E.164 format
   * Requirement 12.1: Test phone number validation
   */
  @IsString()
  @IsNotEmpty({ message: 'Test phone number is required' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  testPhoneNumber: string;

  /**
   * Placeholder values for testing
   * Requirement 12.4: Provide test values for placeholders
   */
  @IsObject()
  @IsOptional()
  placeholderValues?: Record<string, string>;
}

/**
 * DTO for adding test phone numbers
 * Requirement 12.2, 12.7: Test phone number management
 */
export class AddTestPhoneNumberDto {
  /**
   * WhatsApp Business Account ID
   */
  @IsString()
  @IsNotEmpty({ message: 'WABA ID is required' })
  wabaId: string;

  /**
   * Phone number in E.164 format
   */
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  phoneNumber: string;

  /**
   * Optional label for the phone number
   */
  @IsString()
  @IsOptional()
  label?: string;
}

/**
 * DTO for updating test phone numbers
 */
export class UpdateTestPhoneNumberDto {
  /**
   * Optional label for the phone number
   */
  @IsString()
  @IsOptional()
  label?: string;

  /**
   * Whether this phone number is active
   */
  @IsOptional()
  isActive?: boolean;
}
