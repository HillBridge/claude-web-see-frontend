import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhiteScreenService {
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
      this.prisma.whiteScreen.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.whiteScreen.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  async findOne(id: number) {
    return this.prisma.whiteScreen.findUnique({ where: { id } });
  }
}
