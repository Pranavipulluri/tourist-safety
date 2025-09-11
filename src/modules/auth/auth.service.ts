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
    const tourists = await this.touristService.findAll();
    const tourist = tourists.find(t => t.email === email);
    
    if (!tourist) {
      throw new Error('Tourist not found');
    }
    
    return tourist;
  }
}
