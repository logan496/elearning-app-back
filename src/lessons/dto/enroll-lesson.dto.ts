import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../entities/payment.entity';

export class EnrollLessonDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  lessonId: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
