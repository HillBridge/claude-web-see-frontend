import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: '获取用户列表 (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('无权访问');
    return this.usersService.findAll(Number(page), Number(pageSize));
  }

  @ApiOperation({ summary: '获取用户详情' })
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException('无权访问他人信息');
    }
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: '更新用户信息' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException('无权修改他人信息');
    }
    // 普通用户不能修改 role
    if (user.role !== 'ADMIN') {
      delete dto.role;
    }
    return this.usersService.update(id, dto);
  }

  @ApiOperation({ summary: '删除用户 (Admin)' })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('无权删除用户');
    return this.usersService.remove(id);
  }
}
