import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

import { InfraModule } from './infrastructure/infra.module';
import { DetectionConfig } from './config/detection.config';
import { EntitiesModule } from './modules/entities.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          removeOnComplete: 100, // храним последние 100 [web:85]
          removeOnFail: 50,
          attempts: 2, // retry 2 раза [web:85]
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    BullModule.registerQueue({
      name: 'candidates',
      limiter: {
        max: DetectionConfig.rateLimit.subscribePerSecond,
        duration: 1000, // rate limit [web:83]
      },
    }),
    InfraModule,
    EntitiesModule
  ],
})
export class AppModule {}
