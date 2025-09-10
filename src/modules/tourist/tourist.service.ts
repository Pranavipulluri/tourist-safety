import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDatabaseService } from '../../services/mock-database.service';
import { CreateTouristDto } from './dto/create-tourist.dto';
import { UpdateTouristDto } from './dto/update-tourist.dto';

@Injectable()
export class TouristService {
  constructor(
    private readonly mockDb: MockDatabaseService,
  ) {}

  async create(createTouristDto: CreateTouristDto): Promise<any> {
    return await this.mockDb.createTourist(createTouristDto);
  }

  async findAll(page = 1, limit = 10): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const allTourists = await this.mockDb.findAllTourists();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = allTourists.slice(startIndex, endIndex);

    return {
      data,
      total: allTourists.length,
      page,
      limit,
    };
  }

  async findAllWithLocation(): Promise<any[]> {
    return await this.mockDb.findAllTouristsWithCurrentLocation();
  }

  async findOne(id: string): Promise<any> {
    const tourist = await this.mockDb.findTouristById(id);
    if (!tourist) {
      throw new NotFoundException(`Tourist with ID ${id} not found`);
    }
    return tourist;
  }

  async update(id: string, updateTouristDto: UpdateTouristDto): Promise<any> {
    const tourist = await this.mockDb.updateTourist(id, updateTouristDto);
    if (!tourist) {
      throw new NotFoundException(`Tourist with ID ${id} not found`);
    }
    return tourist;
  }

  async remove(id: string): Promise<{ message: string }> {
    const tourist = await this.findOne(id);
    // In mock DB, we don't actually remove, just mark as inactive
    await this.mockDb.updateTourist(id, { isActive: false });
    return { message: 'Tourist deleted successfully' };
  }

  async updateLocation(id: string, location: { latitude: number; longitude: number; address?: string }): Promise<any> {
    const tourist = await this.findOne(id);
    return await this.mockDb.updateTourist(id, { currentLocation: location });
  }

  async getStatus(id: string): Promise<{
    tourist: any;
    isActive: boolean;
    lastSeen: Date;
    currentLocation?: { latitude: number; longitude: number; address?: string };
  }> {
    const tourist = await this.findOne(id);

    return {
      tourist,
      isActive: tourist.isActive,
      lastSeen: tourist.updatedAt,
      currentLocation: tourist.currentLocation,
    };
  }

  async findByEmail(email: string): Promise<any | null> {
    const tourists = await this.mockDb.findAllTourists();
    return tourists.find(t => t.email === email) || null;
  }
}