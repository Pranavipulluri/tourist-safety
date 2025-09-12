import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tourist } from '../../entities/tourist.entity';
import { CreateTouristDto } from './dto/create-tourist.dto';
import { UpdateTouristDto } from './dto/update-tourist.dto';

@Injectable()
export class TouristService {
  constructor(
    @InjectRepository(Tourist)
    private readonly touristRepository: Repository<Tourist>,
  ) {}

  async create(createTouristDto: CreateTouristDto): Promise<Tourist> {
    const tourist = this.touristRepository.create(createTouristDto);
    return await this.touristRepository.save(tourist);
  }

  async findAll(page = 1, limit = 10): Promise<{ data: Tourist[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.touristRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findAllWithLocation(): Promise<Tourist[]> {
    return await this.touristRepository.find({
      where: { isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tourist> {
    const tourist = await this.touristRepository.findOne({
      where: { id },
    });
    
    if (!tourist) {
      throw new NotFoundException(`Tourist with ID ${id} not found`);
    }
    return tourist;
  }

  async update(id: string, updateTouristDto: UpdateTouristDto): Promise<Tourist> {
    const tourist = await this.findOne(id);
    Object.assign(tourist, updateTouristDto);
    return await this.touristRepository.save(tourist);
  }

  async remove(id: string): Promise<{ message: string }> {
    const tourist = await this.findOne(id);
    tourist.isActive = false;
    await this.touristRepository.save(tourist);
    return { message: 'Tourist deleted successfully' };
  }

  async updateLocation(id: string, location: { latitude: number; longitude: number; address?: string }): Promise<Tourist> {
    const tourist = await this.findOne(id);
    tourist.currentLocation = location;
    return await this.touristRepository.save(tourist);
  }

  async getStatus(id: string): Promise<{
    tourist: Tourist;
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

  async findByEmail(email: string): Promise<Tourist | null> {
    return await this.touristRepository.findOne({
      where: { email },
    });
  }
}