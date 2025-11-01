import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ example: 'Je suis très intéressé par ce poste...' })
  @IsString()
  @MinLength(50)
  coverLetter: string;

  @ApiProperty({ example: 'https://example.com/resume.pdf', required: false })
  @IsOptional()
  @IsUrl()
  resumeUrl?: string;

  @ApiProperty({ example: 'https://portfolio.com', required: false })
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @ApiProperty({ example: '+33612345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/...', required: false })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({ example: 'https://github.com/...', required: false })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;
}