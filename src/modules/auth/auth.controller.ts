import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTouristDto } from '../tourist/dto/create-tourist.dto';
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

  @Post('login')
  @ApiOperation({ summary: 'Login tourist' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: { email: string; password?: string }) {
    return this.authService.login(loginDto.email);
  }
}
