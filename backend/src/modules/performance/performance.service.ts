import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    pageSize?: number;
    apikey?: string;
    startTime?: number;
    endTime?: number;
  }) {
    const { page = 1, pageSize = 20, apikey, startTime, endTime } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (apikey) where.apikey = apikey;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = new Date(startTime);
      if (endTime) where.createdAt.lte = new Date(endTime);
    }

    const [list, total] = await Promise.all([
      this.prisma.performanceReport.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.performanceReport.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: number) {
    return this.prisma.performanceReport.findUnique({ where: { id } });
  }

  /** 计算某个项目的性能平均值 */
  async getAvgMetrics(apikey: string) {
    const result = await this.prisma.performanceReport.aggregate({
      where: { apikey },
      _avg: {
        fp: true,
        fcp: true,
        lcp: true,
        fid: true,
        cls: true,
        ttfb: true,
        loadTime: true,
      },
      _count: true,
    });
    return result;
  }
}
