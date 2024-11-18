import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingModule } from './pricing/pricing.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'crypto',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PricingModule,
  ],
  controllers: [],
  providers: [],
})



export class AppModule { }
