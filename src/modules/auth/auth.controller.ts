import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTouristDto, UserRole } from '../tourist/dto/create-tourist.dto';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new tourist' })
  @ApiResponse({ status: 201, description: 'Tourist registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() createTouristDto: CreateTouristDto) {
    return this.authService.register(createTouristDto);
  }

  @Post('register/admin')
  @ApiOperation({ summary: 'Register a new admin' })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerAdmin(@Body() createTouristDto: CreateTouristDto) {
    // Force role to be ADMIN
    const adminData = { ...createTouristDto, role: UserRole.ADMIN };
    return this.authService.register(adminData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login tourist or admin' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: { email: string; password?: string }) {
    return this.authService.login(loginDto.email);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Headers('authorization') authorization?: string) {
    // Get user profile based on auth token
    return this.authService.getProfile(authorization);
  }
}
