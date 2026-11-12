import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Hash before saving: the plain password is never stored.
    const password = await bcrypt.hash(dto.password, 10);
    try {
      // role is not taken from the DTO, so everyone who registers is a PATRON.
      const user = await this.prisma.user.create({
        data: { email: dto.email.toLowerCase(), password },
        select: { id: true, email: true, role: true, createdAt: true },
      });
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    // Same message for "no such user" and "wrong password" so emails can't be probed.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return { accessToken };
  }
}
