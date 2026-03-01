import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16     // bytes
const AUTH_TAG_LENGTH = 16 // bytes

function getKey(keyHex?: string): Buffer {
  const hex = keyHex ?? process.env.ENDPOINT_ENCRYPTION_KEY
  if (!hex) {
    throw new Error('[encryptionUtils] ENDPOINT_ENCRYPTION_KEY is not set')
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('[encryptionUtils] ENDPOINT_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Returns a colon-delimited string: "iv:authTag:ciphertext" (all hex-encoded).
 */
export function encrypt(plaintext: string, keyHex?: string): string {
  const key = getKey(keyHex)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex')
  ].join(':')
}

/**
 * Decrypts a string produced by `encrypt()`.
 * Expected format: "iv:authTag:ciphertext" (all hex-encoded).
 */
export function decrypt(encoded: string, keyHex?: string): string {
  const key = getKey(keyHex)
  const parts = encoded.split(':')
  if (parts.length !== 3) {
    throw new Error('[encryptionUtils] Invalid encrypted format — expected "iv:authTag:ciphertext"')
  }
  const [ivHex, authTagHex, ciphertextHex] = parts
  const iv         = Buffer.from(ivHex, 'hex')
  const authTag    = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString('utf8')
}
