// utils/crypto.js

const crypto = require("crypto");
require("dotenv").config();

const ALGORITHM = "aes-256-cbc";
// Kunci rahasia, HARUS 32 karakter. Simpan di .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
// Initialization Vector, HARUS 16 karakter. Simpan di .env
const IV = process.env.IV;

if (
  !ENCRYPTION_KEY ||
  !IV ||
  ENCRYPTION_KEY.length !== 32 ||
  IV.length !== 16
) {
  throw new Error(
    "ENCRYPTION_KEY (32 chars) and IV (16 chars) must be set in .env file."
  );
}

// Fungsi untuk mengenkripsi teks
function encrypt(text) {
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(IV)
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}

// Fungsi untuk mendekripsi teks
function decrypt(text) {
  const encryptedText = Buffer.from(text, "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(IV)
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
