import { Injectable, UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { RegisterDto, LoginDto } from './dtos/auth.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new HttpException('User with this email already exists', HttpStatus.BAD_REQUEST);
    }

    const user = this.userRepository.create({
      ...registerDto,
      role: UserRole.VIEWER,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'User registered successfully',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !==  UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const [token,] = await Promise.all([this.generateToken(user),
      this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    })]) ;

    return {
      accessToken: token.accessToken,
      message: "Login successful",
    };
  }

  async logout(): Promise<any> {
    return {
      message: 'User logged out successfully',
      clearCookies : true
    }
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  private async generateToken(user: User): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });

    return {
      accessToken,
      expiresIn: this.getTokenExpirationTime(),
    };
  }

  private getTokenExpirationTime(): number {
    const expiresIn = this.configService.get('jwt.expiresIn');
    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 86400;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 86400;
    }
  }
} 