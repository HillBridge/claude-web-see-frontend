import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';

@ApiTags('性能数据')
@ApiBearerAuth()
@Controller('api/performance')
export class PerformanceController {
  constructor(private performanceService: PerformanceService) {}

  @ApiOperation({ summary: '获取性能数据列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'apikey', required: false })
  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('apikey') apikey?: string,
    @Query('startTime') startTime?: number,
    @Query('endTime') endTime?: number,
  ) {
    return this.performanceService.findAll({
      page: Number(page),
      pageSize: Number(pageSize),
      apikey,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    });
  }

  @ApiOperation({ summary: '获取某项目的性能平均值' })
  @Get('avg/:apikey')
  getAvg(@Param('apikey') apikey: string) {
    return this.performanceService.getAvgMetrics(apikey);
  }

  @ApiOperation({ summary: '获取性能数据详情' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.performanceService.findOne(id);
  }
}
