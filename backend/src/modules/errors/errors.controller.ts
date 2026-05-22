import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ErrorsService } from './errors.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('错误数据')
@Controller()
export class ErrorsController {
  constructor(private errorsService: ErrorsService) {}

  /**
   * 兼容原 server.js /getErrorList 接口 (无前缀，Public)
   * 同时提供 /api/errors 用于后台管理 (需鉴权)
   */
  @ApiOperation({ summary: '获取错误列表 (兼容旧接口)' })
  @Public()
  @Get('getErrorList')
  getErrorListLegacy(
    @Query('apikey') apikey?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 100,
  ) {
    return this.errorsService.findAll({
      page: Number(page),
      pageSize: Number(pageSize),
      apikey,
      type,
    });
  }

  @ApiOperation({ summary: '获取错误列表 (分页+过滤)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'apikey', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'startTime', required: false, description: '时间戳(ms)' })
  @ApiQuery({ name: 'endTime', required: false, description: '时间戳(ms)' })
  @Get('api/errors')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('apikey') apikey?: string,
    @Query('type') type?: string,
    @Query('startTime') startTime?: number,
    @Query('endTime') endTime?: number,
  ) {
    return this.errorsService.findAll({
      page: Number(page),
      pageSize: Number(pageSize),
      apikey,
      type,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    });
  }

  @ApiOperation({ summary: '获取错误详情 (含用户行为轨迹)' })
  @ApiBearerAuth()
  @Get('api/errors/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.errorsService.findOne(id);
  }
}
