// src/pricing/pricing.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { CryptoPrice } from './entities/crypto-price.entity';
import { Alert } from './entities/alert.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CryptoPrice, Alert]), // Database entity for pricing
        HttpModule, // Import HttpModule to make HttpService available
    ],
    controllers: [PricingController],
    providers: [PricingService],
})
export class PricingModule { }
