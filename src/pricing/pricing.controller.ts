import { Controller, Get, Param, Query, Body, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
    constructor(private readonly pricingService: PricingService) { }
    @Post('convert')
    async fetchConversion(
        @Body('quantity') quantity: number
    ) {
        if (isNaN(quantity) || quantity <= 0) {
            return { error: 'Invalid quantity provided. Please provide a valid number greater than 0.' };
        }
        return await this.pricingService.fetchConversion(quantity);
    }

    @Get('hourly-data')
    async getHourlyData(): Promise<any[]> {
        return await this.pricingService.getHourlyData();
    }

    @Post('create-alert')
    async createAlert(@Body() body: { emailId: string; alertPrice: number; }) {
        return this.pricingService.createAlert(body.emailId, body.alertPrice);
    }

}
