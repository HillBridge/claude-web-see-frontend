import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RecordScreenService } from './record-screen.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('录屏数据')
@Controller()
export class RecordScreenController {
  constructor(private recordScreenService: RecordScreenService) {}

  /**
   * 兼容旧接口 /getRecordScreenId?id=xxx
   * 前端 HomeView.vue 直接调用此路径播放录屏
   */
  @ApiOperation({ summary: '按 recordScreenId 查询录屏 (兼容旧接口)' })
  @Public()
  @Get('getRecordScreenId')
  getByRecordScreenId(@Query('id') id: string) {
    return this.recordScreenService.findByRecordScreenId(id);
  }

  @ApiOperation({ summary: '录屏列表' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'apikey', required: false })
  @Get('api/record-screens')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('apikey') apikey?: string,
  ) {
    return this.recordScreenService.findAll({
      page: Number(page),
      pageSize: Number(pageSize),
      apikey,
    });
  }

  @ApiOperation({ summary: '录屏详情 (含 events 数据)' })
  @ApiBearerAuth()
  @Get('api/record-screens/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recordScreenService.findOne(id);
  }
}
