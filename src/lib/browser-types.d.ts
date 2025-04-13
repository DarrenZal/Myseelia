// Type declarations for browser-specific APIs

interface Window {
  localStorage: Storage
  crypto: Crypto
}

interface Crypto {
  subtle: SubtleCrypto
}

interface SubtleCrypto {
  generateKey(
    algorithm: Algorithm,
    extractable: boolean,
    keyUsages: string[]
  ): Promise<CryptoKeyPair>
  exportKey(
    format: string,
    key: CryptoKey
  ): Promise<ArrayBuffer>
}

interface CryptoKeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
}

interface CryptoKey {
  type: string
  extractable: boolean
  algorithm: Algorithm
  usages: string[]
}

interface Algorithm {
  name: string
  [key: string]: any
}
