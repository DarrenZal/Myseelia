// This module contains browser-specific code and is only used in the browser

// Check if we're in a browser environment
export const isBrowser = () => typeof window !== 'undefined'

// Get registered users from localStorage
export const getRegisteredUsers = (): string[] => {
  if (!isBrowser()) return []
  try {
    return JSON.parse(window.localStorage.getItem('registeredUsers') || '[]')
  } catch (error) {
    console.error('Error getting registered users:', error)
    return []
  }
}

// Add a user to the registered users list
export const addRegisteredUser = (username: string): void => {
  if (!isBrowser()) return
  try {
    const users = getRegisteredUsers()
    if (!users.includes(username)) {
      users.push(username)
      window.localStorage.setItem('registeredUsers', JSON.stringify(users))
    }
  } catch (error) {
    console.error('Error adding registered user:', error)
  }
}

// Check if a username is available
export const isUsernameAvailable = (username: string): boolean => {
  if (!isBrowser()) return true
  const users = getRegisteredUsers()
  return !users.includes(username)
}

// Store a public key for a user
export const storePublicKey = (username: string, publicKey: string): void => {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(`${username}_publicKey`, publicKey)
  } catch (error) {
    console.error('Error storing public key:', error)
  }
}

// Generate a key pair using Web Crypto API
export const generateKeyPair = async (): Promise<CryptoKeyPair | null> => {
  if (!isBrowser()) return null
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    )
  } catch (error) {
    console.error('Error generating key pair:', error)
    return null
  }
}

// Export a public key to a base64 string
export const exportPublicKey = async (publicKey: CryptoKey): Promise<string | null> => {
  if (!isBrowser()) return null
  try {
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      'raw',
      publicKey
    )
    
    return btoa(
      String.fromCharCode.apply(null, Array.from(new Uint8Array(publicKeyBuffer)))
    )
  } catch (error) {
    console.error('Error exporting public key:', error)
    return null
  }
}
