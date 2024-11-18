// src/pricing/pricing.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { CryptoPrice } from './entities/crypto-price.entity';
import { Alert } from './entities/alert.entity';
const nodemailer = require('nodemailer');

let url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
let apiKey = '0b71d772-b6e7-4878-a500-0b244b27a733';
const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 587,
    auth: {
        user: '8897da840cb037',
        pass: 'a5e1113ff513e9',
    },
});

@Injectable()
export class PricingService implements OnModuleInit {
    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(CryptoPrice)
        private readonly priceRepository: Repository<CryptoPrice>,
        @InjectRepository(Alert)
        private readonly alertRepository: Repository<Alert>,
    ) { }

    async fetchPrices() {
        console.log("cron running......................");
        try {
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    'X-CMC_PRO_API_KEY': apiKey,
                },
                params: {
                    symbol: 'ETH,POL',
                    convert: "USD",
                },
            });

            const ethData = response.data.data.ETH;
            const polData = response.data.data.POL;
            if (!ethData || !polData) {
                return { error: 'Unable to fetch data for one or both coins' };
            }

            //alert 3%
            if (Math.abs(ethData.quote.USD.percent_change_1h) >= 3) {
                const mailOptions = {
                    from: '"Your App Name" <your_email@example.com>',
                    to: 'recipient@yopmail.com',
                    subject: 'Price Alert for Ethereum',
                    text: `Ethereum price has changed by ${Math.abs(ethData.quote.USD.percent_change_1h)}% in the last hour.`,
                    html: `<b>Ethereum price has changed by ${Math.abs(ethData.quote.USD.percent_change_1h)}% in the last hour.</b>`,
                };

                // Send the email
                await transporter.sendMail(mailOptions);
                console.log('Alert email sent successfully');

            }

            const alert: any = await this.getAlertsForPrice(ethData.quote.USD.price)
            if (alert.length) {
                for (const alertItem of alert) {
                    const mailOptions = {
                        from: '"Your App Name" <your_email@example.com>',
                        to: alertItem.emailId,
                        subject: 'Price Alert for Ethereum',
                        text: `Ethereum price has changed to your alert limit.`,
                        html: `<b>Ethereum price has changed to your alert limit.</b>`,
                    }
                    try {
                        await transporter.sendMail(mailOptions);
                        console.log(`Alert email sent successfully to ${alertItem.emailId}`);
                    } catch (error) {
                        console.error(`Failed to send email to ${alertItem.emailId}:`, error);
                    }
                }

            }

            const ethDetails: any = {
                name: ethData.name,
                price: ethData.quote.USD.price,
                percent_change_24h: ethData.quote.USD.percent_change_24h,
                type: 'ETH'
            };

            const polDetails: any = {
                name: polData.name,
                price: polData.quote.USD.price,
                percent_change_24h: polData.quote.USD.percent_change_24h,
                type: 'POL'

            };

            await this.savePriceData(ethDetails);
            await this.savePriceData(polDetails);

            return { eth: ethDetails, pol: polDetails };
        } catch (error) {
            console.error('Error fetching prices:', error);
            return { error: 'Error fetching cryptocurrency data' };
        }
    }

    //converting service
    async fetchConversion(quantity: number) {
        try {
            const fromCurrency = 'ETH'
            const toCurrency = 'BTC'
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    'X-CMC_PRO_API_KEY': apiKey,
                },
                params: {
                    symbol: `${fromCurrency},${toCurrency}`,
                    convert: 'USD',
                },
            });

            const fromData = response.data.data[fromCurrency];
            const toData = response.data.data[toCurrency];

            if (!fromData || !toData) {
                return { error: `Unable to fetch data for ${fromCurrency} or ${toCurrency}` };
            }

            const fromPriceInUSD = fromData.quote.USD.price;
            const toPriceInUSD = toData.quote.USD.price;
            const platformFee = 0.03; // 3% fee
            const quantityAfterFee = quantity * (1 - platformFee);
            const usdValue = fromPriceInUSD * quantityAfterFee;
            const convertedAmount = usdValue / toPriceInUSD;
            const convertData = {
                fromCurrency,
                toCurrency,
                originalQuantity: quantity,
                quantityAfterFee,
                fromPriceInUSD,
                toPriceInUSD,
                convertedAmount,
            };
            return convertData
        } catch (error) {
            console.error('Error fetching prices:', error);
            return { error: 'Error fetching cryptocurrency data' };
        }
    }

    //every hour fetching data
    async getHourlyData(type = 'ETH'): Promise<any[]> {
        const now = new Date(); // Current local time
        const oneDayAgo = new Date(now);
        oneDayAgo.setHours(now.getHours() - 24);

        const hourlyData = await this.priceRepository
            .createQueryBuilder('price')
            .select([
                'price.id',
                'price.name',
                'price.price',
                'price.percent_change_24h',
                'price.createdAt',
                'price.type'
            ])
            .where('price.type = :type', { type })
            .andWhere('price.createdAt BETWEEN :start AND :end', {
                start: oneDayAgo,
                end: now,
            })
            .orderBy('price.createdAt', 'ASC')
            .getMany();

        return this.groupDataByHour(hourlyData);
    }

    private groupDataByHour(data: any[]): any[] {
        const grouped = [];
        const now = new Date();

        for (let i = 0; i < 24; i++) {
            const hourStart = new Date(now);
            hourStart.setHours(now.getHours() - (24 - i), 0, 0, 0);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hourStart.getHours() + 1);

            const hourlyPrices = data.filter((item) => {
                const createdAt = new Date(item.createdAt);
                return createdAt >= hourStart && createdAt < hourEnd;
            });

            grouped.push({
                hour: `${hourStart.getHours()}:00 - ${hourEnd.getHours()}:00`,
                price: hourlyPrices[0],
            });
        }

        return grouped;
    }

    //create alert
    async createAlert(emailId, alertPrice): Promise<any> {
        // Create a new alert
        const alert = this.alertRepository.create({
            emailId,
            alertPrice,
        });

        // Save the alert to the database
        return await this.alertRepository.save(alert);
    }

    //get alert data
    async getAlertsForPrice(newPrice: any): Promise<Alert[]> {
        const data = await this.alertRepository.find({
            where: {
                alertPrice: MoreThan(newPrice),
            },
        });
        return data
    }


    async savePriceData(priceDetails: any) {
        const price = this.priceRepository.create({
            name: priceDetails.name,
            price: priceDetails.price,
            percent_change_24h: priceDetails.percent_change_24h,
            currency: 'USD',
            type: priceDetails.type
        });
        await this.priceRepository.save(price);
    }

    async onModuleInit() {
        setInterval(() => this.fetchPrices(), 5 * 60 * 1000);
    }
}