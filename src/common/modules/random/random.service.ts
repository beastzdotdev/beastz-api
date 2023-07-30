import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomService {
  static readonly ASCII =
    '!"#$%&\'()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz0123456789{|}~';
  static readonly HEX = 'abcdefghijklmnopqrstuvwxyz0123456789';

  generateRandomASCII(length: number): string {
    return this.generateRandomString(length, RandomService.ASCII, RandomService.ASCII.length);
  }

  generateRandomHEX(length: number): string {
    return this.generateRandomString(length, RandomService.HEX, RandomService.HEX.length);
  }

  /**
   * @returns generated random integer from min to max inclusive
   */
  generateRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateRandomIntAsString(min: number, max: number): string {
    const number = Math.floor(Math.random() * (max - min + 1)) + min;

    return number.toString();
  }

  genFixedNumberAsString(length: number): string {
    let str = '';

    for (let i = 0; i < length; i++) {
      str += Math.floor(Math.random() * 10); // 0-9 inclusive
    }

    return str;
  }

  generateRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private generateRandomString(length: number, charset: string, charsetLength: number): string {
    let s = '';

    for (let i = 0; i < length; i++) {
      s += charset.charAt(Math.floor(Math.random() * charsetLength));
    }

    return s;
  }
}
