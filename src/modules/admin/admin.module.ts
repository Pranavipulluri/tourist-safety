import { Module } from '@nestjs/common';
import { TouristModule } from '../tourist/tourist.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [TouristModule],
  controllers: [AdminController],
  providers: [],
  exports: [],
})
export class AdminModule {}
