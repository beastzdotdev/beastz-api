import crypto from 'crypto';
import { promisify } from './helper';

export const encryption = Object.freeze({
  aes256gcm: {
    name: 'aes-256-gcm' as const,

    encryptSync(text: string, masterkey: string): string {
      if (typeof text !== 'string') {
        throw new Error(`encryption error string was not found, found ${typeof text}`);
      }

      // random initialization vector
      const iv = crypto.randomBytes(16);

      // random salt
      const salt = crypto.randomBytes(64);

      // derive encryption key: 32 byte key length
      // in assumption the masterkey is a cryptographic and NOT a password there is no need for
      // a large number of iterations. It may can replaced by HKDF
      // the value of 2145 is randomly chosen!
      const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

      // AES 256 GCM Mode
      const cipher = crypto.createCipheriv(this.name, key, iv);

      // encrypt the given text
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

      // extract the auth tag
      const tag = cipher.getAuthTag();

      // generate output
      return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    },

    async encrypt(text: string, masterkey: string): Promise<string> {
      return promisify(() => this.encryptSync(text, masterkey));
    },

    decryptSync(encryptedText: string, masterkey: string) {
      if (typeof encryptedText !== 'string') {
        throw new Error(`decryption error string was not found, found ${typeof encryptedText}`);
      }

      // base64 decoding
      const bData = Buffer.from(encryptedText, 'base64');

      // convert data to buffers
      const salt = bData.subarray(0, 64);
      const iv = bData.subarray(64, 80);
      const tag = bData.subarray(80, 96);
      const text = bData.subarray(96);

      // derive key using; 32 byte key length
      const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

      // AES 256 GCM Mode
      const decipher = crypto.createDecipheriv(this.name, key, iv);
      decipher.setAuthTag(tag);

      try {
        // decrypt the given text
        return decipher.update(text, undefined, 'utf8') + decipher.final('utf8');
      } catch (error) {
        console.log(error);
        return null;
      }
    },

    async decrypt(text: string, masterkey: string): Promise<string | null> {
      return promisify(() => this.decryptSync(text, masterkey));
    },
  },
});
