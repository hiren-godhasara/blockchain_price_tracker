import { Controller, Get, Query } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('price/moralis')
  async getPriceFromMoralis(@Query('network') network: string) {
    return this.blockchainService.getBlockchainPriceFromMoralis(network);
  }

  @Get('price/solscan')
  async getPriceFromSolscan(@Query('network') network: string) {
    return this.blockchainService.getBlockchainPriceFromSolscan(network);
  }
}
