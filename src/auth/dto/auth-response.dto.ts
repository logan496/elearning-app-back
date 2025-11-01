import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT',
  })
  access_token: string;

  @ApiProperty({
    example: {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      isPublisher: false,
    },
    description: 'Informations utilisateur',
  })
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string;
    isPublisher: boolean;
    isAdmin: boolean;
  };
}
