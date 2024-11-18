import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class BlockchainService {
  private moralisBaseUrl = 'https://deep-index.moralis.io/api/v2';
  private solscanBaseUrl = 'https://api.solscan.io';

  private moralisApiKey = 'your-moralis-api-key'; // Replace with your Moralis API key
  private solscanApiKey = 'your-solscan-api-key'; // Replace with your Solscan API key

  async getBlockchainPriceFromMoralis(network: string): Promise<any> {
    try {
      const response = await axios.get(`${this.moralisBaseUrl}/price`, {
        params: { chain: network },
        headers: {
          'X-API-Key': this.moralisApiKey,
        },
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch price from Moralis: ${error.response?.data?.message || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBlockchainPriceFromSolscan(network: string): Promise<any> {
    try {
      const response = await axios.get(`${this.solscanBaseUrl}/market/token`, {
        params: { symbol: network },
        headers: {
          'Authorization': `Bearer ${this.solscanApiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch price from Solscan: ${error.response?.data?.message || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
