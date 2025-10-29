import { PartialType } from '@nestjs/mapped-types';
import { CreatePetDTO } from './create.pet.dto';

export class UpdatePetDTO extends PartialType(CreatePetDTO) {}
