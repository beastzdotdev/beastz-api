import crypto from 'crypto';
import { InternalServerErrorException } from '@nestjs/common';
import { constants } from './constants';

export const random = Object.freeze({
  genRandStringFromCharset(length: number, charset: string): string {
    const charsetLength = charset.length;
    const randomBytes = crypto.randomBytes(length);

    let randomString = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charsetLength;
      randomString += charset.charAt(randomIndex);
    }

    return randomString;
  },

  generateRandomASCII(len: number): string {
    return this.genRandStringFromCharset(len, constants.ASCII);
  },

  generateRandomHEX(len: number): string {
    return this.genRandStringFromCharset(len, constants.HEX);
  },

  generateRandomString(length: number): string {
    let s = '';

    for (let i = 0; i < length; i++) {
      s += constants.ASCII.charAt(Math.floor(Math.random() * constants.ASCII.length));
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

  generateRandomIntStr(min: number, max: number): string {
    return this.generateRandomInt(min, max).toString();
  },
});
