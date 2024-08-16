import crypto from 'crypto';
import { InternalServerErrorException } from '@nestjs/common';

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

  getRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  },

  /**
   * `Math.floor(max) + 1` to include the upper bound in the range
   * @returns generated random integer from min to max inclusive
   */
  generateRandomInt(min: number, max: number): number {
    if (min > max) {
      throw new InternalServerErrorException('Something went wrong in method');
    }

    return crypto.randomInt(Math.ceil(min), Math.floor(max) + 1);
  },
});
