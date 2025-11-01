import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDate,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  JobType,
  ExperienceLevel,
  JobStatus, // ← Ajoutez cet import
} from '../../entities/job-posting.entity';

export class CreateJobPostingDto {
  @ApiProperty({ example: 'Développeur Full Stack' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Nous recherchons un développeur...' })
  @IsString()
  @MinLength(50)
  description: string;

  @ApiProperty({ example: 'Maîtrise de React, Node.js...' })
  @IsString()
  requirements: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  company: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyLogo?: string;

  @ApiProperty({ example: 'Paris, France' })
  @IsString()
  location: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRemote: boolean;

  @ApiProperty({ enum: JobType, example: JobType.FULL_TIME })
  @IsEnum(JobType)
  jobType: JobType;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.MID })
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @ApiProperty({ example: 40000, required: false })
  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @ApiProperty({ example: 60000, required: false })
  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @ApiProperty({ example: 'EUR', required: false })
  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @ApiProperty({ example: ['React', 'Node.js', 'TypeScript'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deadline?: Date;

  // ✅ AJOUTEZ CE CHAMP
  @ApiProperty({
    enum: JobStatus,
    example: JobStatus.OPEN,
    default: JobStatus.OPEN,
    required: false,
    description: "Statut de l'offre (par défaut: OPEN)",
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus = JobStatus.OPEN; // ← Valeur par défaut
}

export class UpdateJobPostingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsArray()
  skills?: string[];

  // ✅ AJOUTEZ AUSSI ICI SI BESOIN DE MODIFIER LE STATUS
  @ApiProperty({
    enum: JobStatus,
    required: false,
    description: "Statut de l'offre",
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
