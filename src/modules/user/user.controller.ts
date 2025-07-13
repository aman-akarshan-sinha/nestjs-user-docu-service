import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dtos/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { TRequest } from 'src/common/constants/app.types';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.createUser(createUserDto);
      return {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(@Query() query: UserQueryDto) {
    try {
      const result = await this.userService.findAll(query);
      return {
        users: result.users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        })),
        total: result.total,
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get logged-in user profile' })
  @ApiResponse({ status: 200, description: 'User profile fetched successfully' })
  async getProfile(@Req() req: TRequest) {
    try {
      return await this.userService.findById(req.user.userId);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Req() req: TRequest, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userService.updateUser(req?.user?.userId, updateUserDto);
      return {
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User fetched successfully' })
  async findById(@Param('id') id: number) {
    try {
      return await this.userService.findById(id);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userService.updateUser(id, updateUserDto);
      return {
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  async updateUserRole(@Param('id') id: number, @Body() body: { role: UserRole }) {
    try {
      const user = await this.userService.updateUserRole(id, body.role);
      return {
        message: 'User role updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: number) {
    try {
      await this.userService.deleteUser(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ? error.getStatus() : HttpStatus.BAD_REQUEST,
      );
    }
  }
}
