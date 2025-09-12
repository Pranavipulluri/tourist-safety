import { Injectable } from '@nestjs/common';
import { CreateTouristDto, UserRole } from '../tourist/dto/create-tourist.dto';
import { TouristService } from '../tourist/tourist.service';

@Injectable()
export class AuthService {
  constructor(private readonly touristService: TouristService) {}

  async register(createTouristDto: CreateTouristDto) {
    // Remove password from the data sent to tourist service for now
    const { password, ...touristData } = createTouristDto;
    
    // For now, just create a tourist - no password hashing
    // In the future, you would hash the password and store it
    if (password) {
      console.log('Password provided for registration (not stored yet):', password.substring(0, 3) + '***');
    }
    
    const tourist = await this.touristService.create(touristData);
    
    // Return the expected format for frontend
    return {
      user: {
        ...tourist,
        role: tourist.role || UserRole.TOURIST,
        isVerified: true // Mock verification for now
      },
      token: 'mock-jwt-token-' + tourist.id, // Mock token for now
      message: 'Registration successful'
    };
  }

  async login(email: string) {
    // For now, just find by email - no password verification
    const tourist = await this.touristService.findByEmail(email);
    
    if (!tourist) {
      throw new Error('Tourist not found');
    }
    
    // Return the expected format for frontend
    return {
      user: {
        ...tourist,
        role: tourist.role || UserRole.TOURIST,
        isVerified: true // Mock verification for now
      },
      token: 'mock-jwt-token-' + tourist.id, // Mock token for now
      message: 'Login successful'
    };
  }

  async getProfile(authorization?: string) {
    // Extract token from authorization header
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new Error('No valid authorization token provided');
    }
    
    const token = authorization.replace('Bearer ', '');
    
    // For mock implementation, extract tourist ID from token
    const touristId = token.replace('mock-jwt-token-', '');
    
    const tourist = await this.touristService.findOne(touristId);
    
    if (!tourist) {
      throw new Error('Tourist not found');
    }
    
    return {
      user: {
        ...tourist,
        role: tourist.role || UserRole.TOURIST,
        isVerified: true // Mock verification for now
      },
      message: 'Profile retrieved successfully'
    };
  }
}
