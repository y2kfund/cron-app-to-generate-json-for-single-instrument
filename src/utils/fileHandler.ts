import { promises as fs } from 'fs';
import path from 'path';

export async function writeJsonToFile(symbol: string, data: any): Promise<void> {
  const filePath = path.join(__dirname, '../../output', `${symbol}`);
  
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), { flag: 'w' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write JSON file for symbol ${symbol}: ${errorMessage}`);
  }
}