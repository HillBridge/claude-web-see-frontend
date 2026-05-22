import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReportModule } from './modules/report/report.module';
import { ErrorsModule } from './modules/errors/errors.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { RecordScreenModule } from './modules/record-screen/record-screen.module';
import { WhiteScreenModule } from './modules/white-screen/white-screen.module';
import { SourceMapModule } from './modules/source-map/source-map.module';

@Module({
  imports: [
    // 多环境配置 — 全局可用
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ReportModule,
    ErrorsModule,
    PerformanceModule,
    RecordScreenModule,
    WhiteScreenModule,
    SourceMapModule,
  ],
  providers: [
    // 全局 JWT 守卫 (路由默认需要认证，@Public() 跳过)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局统一响应格式拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // 全局请求日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 全局 HTTP 异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
