import { Injectable } from '@nestjs/common';
import { CreateTouristDto } from '../tourist/dto/create-tourist.dto';
import { TouristService } from '../tourist/tourist.service';

@Injectable()
export class AuthService {
  constructor(private readonly touristService: TouristService) {}

  async register(createTouristDto: CreateTouristDto) {
    // For now, just create a tourist - no password hashing
    return this.touristService.create(createTouristDto);
  }

  async login(email: string) {
    // For now, just find by email - no password verification
    const tourist = await this.touristService.findByEmail(email);
    
    if (!tourist) {
      throw new Error('Tourist not found');
    }
    
    return tourist;
  }
}
