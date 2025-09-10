import { PartialType } from '@nestjs/swagger';
import { CreateTouristDto } from './create-tourist.dto';

export class UpdateTouristDto extends PartialType(CreateTouristDto) {}
