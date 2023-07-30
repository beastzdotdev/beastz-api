import * as crypto from 'crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class RandomService {
  static readonly ASCII = '!"#$%&()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz0123456789{}~';
  static readonly HEX = 'abcdefghijklmnopqrstuvwxyz0123456789';

  generateRandomASCII = (len: number) => this.genRanStringFromCharset(len, RandomService.ASCII);
  generateRandomHEX = (len: number) => this.genRanStringFromCharset(len, RandomService.HEX);

  genRanStringFromCharset(length: number, charset: string): string {
    const charsetLength = charset.length;
    const randomBytes = crypto.randomBytes(length);

    let randomString = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charsetLength;
      randomString += charset.charAt(randomIndex);
    }

    return randomString;
  }

  /**
   * `Math.floor(max) + 1` to include the upper bound in the range
   * @number 91023
   * @returns generated random integer from min to max inclusive
   */
  generateRandomInt(min: number, max: number): number {
    if (min > max) {
      throw new InternalServerErrorException('Something went wrong in method 91023');
    }

    return crypto.randomInt(Math.ceil(min), Math.floor(max) + 1);
  }
}
