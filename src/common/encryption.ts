import crypto from 'crypto';
import { random } from './random';

export const encryption = Object.freeze({
  aes256cbc: {
    alg: 'aes-256-cbc',

    genIv() {
      return random.generateRandomString(16);
    },

    async encrypt(text: string, key: string, iv: string): Promise<string | null> {
      return new Promise((resolve, _reject) => {
        try {
          let cipher = crypto.createCipheriv(encryption.aes256cbc.alg, key, iv);
          let encrypted = cipher.update(text, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          resolve(encrypted);
        } catch (error) {
          resolve(null);
        }
      });
    },

    async decrypt(text: string, key: string, iv: string): Promise<string | null> {
      return new Promise((resolve, _reject) => {
        try {
          let decipher = crypto.createDecipheriv(encryption.aes256cbc.alg, key, iv);
          let decrypted = decipher.update(text, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          resolve(decrypted);
        } catch (error) {
          resolve(null);
        }
      });
    },
  },
});
