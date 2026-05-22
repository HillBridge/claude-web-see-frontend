import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WhiteScreenService } from './white-screen.service';

@ApiTags('白屏检测')
@ApiBearerAuth()
@Controller('api/white-screens')
export class WhiteScreenController {
  constructor(private whiteScreenService: WhiteScreenService) {}

  @ApiOperation({ summary: '白屏检测记录列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'apikey', required: false })
  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('apikey') apikey?: string,
    @Query('startTime') startTime?: number,
    @Query('endTime') endTime?: number,
  ) {
    return this.whiteScreenService.findAll({
      page: Number(page),
      pageSize: Number(pageSize),
      apikey,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    });
  }

  @ApiOperation({ summary: '白屏检测记录详情' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.whiteScreenService.findOne(id);
  }
}
