import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PricesModule } from './prices/prices.module';
import { AlertsModule } from './alerts/alerts.module';
import { EmailModule } from './email/email.module';
import { SwapModule } from './swap/swap.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PricesModule,
    AlertsModule,
    EmailModule,
    SwapModule,
  ],
})
export class AppModule {}
