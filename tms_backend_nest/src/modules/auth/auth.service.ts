import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    console.log('login dto', dto);
    const user = await this.usersService.findByEmail(dto.email);
    console.log('user', user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    console.log('before sign');

    console.log('payload', payload);
    console.log('secret', process.env.JWT_SECRET);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });
    console.log('after sign');
    return {
      accessToken,

      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
