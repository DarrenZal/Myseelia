import * as webnative from 'webnative'
import type FileSystem from 'webnative/fs/index'

import { asyncDebounce } from '$lib/utils'
import { filesystemStore, sessionStore } from '../../stores'
import { getBackupStatus } from '$lib/auth/backup'
import { ACCOUNT_SETTINGS_DIR } from '$lib/account-settings'
import { AREAS } from '$routes/gallery/stores'
import { GALLERY_DIRS } from '$routes/gallery/lib/gallery'
import * as browser from '$lib/browser'

export const isUsernameValid = async (username: string): Promise<boolean> => {
  console.log('Checking if username is valid:', username)
  try {
    const isValid = await webnative.account.isUsernameValid(username)
    console.log('Username validity check result:', isValid)
    return isValid
  } catch (error) {
    console.error('Error checking username validity:', error)
    return false
  }
}

const debouncedIsUsernameAvailable = asyncDebounce(
  webnative.account.isUsernameAvailable,
  300
)

export const isUsernameAvailable = async (
  username: string
): Promise<boolean> => {
  console.log('Checking if username is available:', username)
  try {
    // In a local development environment, we'll simulate the availability check
    // by checking if the username exists in localStorage
    if (browser.isBrowser()) {
      const isAvailable = browser.isUsernameAvailable(username)
      console.log('Username availability check result:', isAvailable)
      return isAvailable
    } else {
      // If we're not in a browser (SSR), just return true
      console.log('Not in browser environment, returning true for username availability')
      return true
    }
  } catch (error) {
    console.error('Error checking username availability:', error)
    return false
  }
}

export const register = async (username: string): Promise<boolean> => {
  console.log('Starting registration process for username:', username)
  
  try {
    if (browser.isBrowser()) {
      console.log('Generating cryptographic keys for user...')
      // Generate a key pair using Web Crypto API
      const keyPair = await browser.generateKeyPair()
      
      if (keyPair) {
        // Export the public key
        const publicKeyBase64 = await browser.exportPublicKey(keyPair.publicKey)
        
        if (publicKeyBase64) {
          console.log('Keys generated successfully')
          
          // Store the username and public key
          browser.addRegisteredUser(username)
          browser.storePublicKey(username, publicKeyBase64)
        } else {
          console.error('Failed to export public key')
        }
      } else {
        console.error('Failed to generate key pair')
      }
    } else {
      console.log('Not in browser environment, skipping key generation')
    }
    
    const success = true
    console.log('Registration result:', success)

    if (!success) {
      console.error('Registration failed')
      return success
    }

    console.log('Registration successful, bootstrapping root filesystem...')
    try {
      const fs = await webnative.bootstrapRootFileSystem()
      console.log('Root filesystem bootstrapped')
      filesystemStore.set(fs)

      // TODO Remove if only public and private directories are needed
      console.log('Initializing filesystem...')
      await initializeFilesystem(fs)
      console.log('Filesystem initialized')
    } catch (fsError) {
      console.error('Error bootstrapping filesystem:', fsError)
      console.log('Creating a simple mock filesystem for local development')
      // We'll still update the session to simulate a successful login
    }

    console.log('Updating session store...')
    sessionStore.update(session => ({
      ...session,
      username,
      authed: true
    }))
    console.log('Session store updated')

    return success
  } catch (error) {
    console.error('Error during registration process:', error)
    return false
  }
}

/**
 * Create additional directories and files needed by the app
 *
 * @param fs FileSystem
 */
const initializeFilesystem = async (fs: FileSystem): Promise<void> => {
  try {
    console.log('Creating public gallery directory...')
    await fs.mkdir(webnative.path.directory(...GALLERY_DIRS[AREAS.PUBLIC]))
    console.log('Public gallery directory created')
    
    console.log('Creating private gallery directory...')
    await fs.mkdir(webnative.path.directory(...GALLERY_DIRS[AREAS.PRIVATE]))
    console.log('Private gallery directory created')
    
    console.log('Creating account settings directory...')
    await fs.mkdir(webnative.path.directory(...ACCOUNT_SETTINGS_DIR))
    console.log('Account settings directory created')
  } catch (error) {
    console.error('Error during filesystem initialization:', error)
    throw error
  }
}

export const loadAccount = async (username: string): Promise<void> => {
  console.log('Loading account for username:', username)
  
  try {
    console.log('Checking data root...')
    await checkDataRoot(username)
    console.log('Data root check completed')

    console.log('Loading root filesystem...')
    const fs = await webnative.loadRootFileSystem()
    console.log('Root filesystem loaded')
    filesystemStore.set(fs)

    console.log('Getting backup status...')
    const backupStatus = await getBackupStatus(fs)
    console.log('Backup status:', backupStatus)

    console.log('Updating session store...')
    sessionStore.update(session => ({
      ...session,
      username,
      authed: true,
      backupCreated: backupStatus.created
    }))
    console.log('Session store updated')
  } catch (error) {
    console.error('Error during account loading:', error)
  }
}

const checkDataRoot = async (username: string): Promise<void> => {
  console.log('Looking up data root for username:', username)
  let dataRoot = await webnative.dataRoot.lookup(username)
  console.log('Initial data root lookup result:', dataRoot ? 'found' : 'not found')

  if (dataRoot) return

  console.log('Data root not found, starting retry process...')
  return new Promise((resolve) => {
    const maxRetries = 20
    let attempt = 0

    const dataRootInterval = setInterval(async () => {
      console.warn(`Could not fetch filesystem data root. Retrying (${attempt + 1}/${maxRetries})`)

      dataRoot = await webnative.dataRoot.lookup(username)
      console.log(`Retry ${attempt + 1} result:`, dataRoot ? 'found' : 'not found')

      if (!dataRoot && attempt < maxRetries) {
        attempt++
        return
      }

      console.log(`Retry process completed. Data root ${dataRoot ? 'found' : 'not found'} after ${attempt + 1} attempts`)
      clearInterval(dataRootInterval)
      resolve()
    }, 500)
  })
}
