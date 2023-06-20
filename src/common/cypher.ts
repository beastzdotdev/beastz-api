import * as fs from 'fs';
import * as crypto from 'crypto';

//TODO refactor accordingly
const algorithm = 'aes-256-cbc';
const secretKey = crypto.randomBytes(32); // must be 32 bits length
const iv = crypto.randomBytes(16); // must be 16 bits length

// Function to encrypt a file
function encryptFile(inputPath, outputPath) {
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  input.pipe(cipher).pipe(output);

  console.log('File encrypted successfully.');
}

// Function to decrypt a file
function decryptFile(inputPath, outputPath) {
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

  input.pipe(decipher).pipe(output);

  console.log('File decrypted successfully.');
}

// Example usage
const inputFile = 'path/to/input/file';
const encryptedFile = 'path/to/encrypted/file';
const decryptedFile = 'path/to/decrypted/file';

encryptFile(inputFile, encryptedFile);
decryptFile(encryptedFile, decryptedFile);
