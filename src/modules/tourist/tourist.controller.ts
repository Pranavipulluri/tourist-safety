import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTouristDto } from './dto/create-tourist.dto';
import { UpdateTouristDto } from './dto/update-tourist.dto';
import { TouristService } from './tourist.service';

@ApiTags('Tourist')
@Controller('tourist')
export class TouristController {
  constructor(private readonly touristService: TouristService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new tourist' })
  @ApiResponse({ status: 201, description: 'Tourist registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createTouristDto: CreateTouristDto) {
    return this.touristService.create(createTouristDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tourists' })
  @ApiResponse({ status: 200, description: 'List of tourists' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'withLocation', required: false, description: 'Include current location data' })
  async findAll(
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Query('withLocation') withLocation?: string
  ) {
    if (withLocation === 'true') {
      return this.touristService.findAllWithLocation();
    }
    return this.touristService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tourist by ID' })
  @ApiResponse({ status: 200, description: 'Tourist details' })
  @ApiResponse({ status: 404, description: 'Tourist not found' })
  @ApiParam({ name: 'id', description: 'Tourist ID' })
  async findOne(@Param('id') id: string) {
    return this.touristService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tourist information' })
  @ApiResponse({ status: 200, description: 'Tourist updated successfully' })
  @ApiResponse({ status: 404, description: 'Tourist not found' })
  @ApiParam({ name: 'id', description: 'Tourist ID' })
  async update(@Param('id') id: string, @Body() updateTouristDto: UpdateTouristDto) {
    return this.touristService.update(id, updateTouristDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tourist' })
  @ApiResponse({ status: 200, description: 'Tourist deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tourist not found' })
  @ApiParam({ name: 'id', description: 'Tourist ID' })
  async remove(@Param('id') id: string) {
    return this.touristService.remove(id);
  }

  @Post(':id/location')
  @ApiOperation({ summary: 'Update tourist location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiParam({ name: 'id', description: 'Tourist ID' })
  async updateLocation(
    @Param('id') id: string,
    @Body() location: { latitude: number; longitude: number; address?: string }
  ) {
    return this.touristService.updateLocation(id, location);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get tourist safety status' })
  @ApiResponse({ status: 200, description: 'Tourist safety status' })
  @ApiParam({ name: 'id', description: 'Tourist ID' })
  async getStatus(@Param('id') id: string) {
    return this.touristService.getStatus(id);
  }
}
