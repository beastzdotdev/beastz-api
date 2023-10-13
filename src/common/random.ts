import crypto from 'crypto';
import { Constants } from './constants';
import { InternalServerErrorException } from '@nestjs/common';

export const random = {
  generateRandomASCII(len: number): string {
    return this.genRanStringFromCharset(len, Constants.ASCII);
  },

  generateRandomHEX(len: number): string {
    return this.genRanStringFromCharset(len, Constants.HEX);
  },

  genRanStringFromCharset(length: number, charset: string): string {
    const charsetLength = charset.length;
    const randomBytes = crypto.randomBytes(length);

    let randomString = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charsetLength;
      randomString += charset.charAt(randomIndex);
    }

    return randomString;
  },

  generateRandomString(length: number): string {
    let s = '';

    for (let i = 0; i < length; i++) {
      s += Constants.ASCII.charAt(Math.floor(Math.random() * Constants.ASCII.length));
    }

    return s;
  },

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
  },
};
