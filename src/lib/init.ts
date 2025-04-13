import * as webnative from 'webnative'
import { setup } from 'webnative'

import { filesystemStore, sessionStore } from '../stores'
import { getBackupStatus, type BackupStatus } from '$lib/auth/backup'

// Enable debugging to see detailed logs
setup.debug({ enabled: true })

export const initialize = async (): Promise<void> => {
  console.log('Initializing webnative app...')
  try {
    let backupStatus: BackupStatus = null

    console.log('Calling webnative.app with useWnfs: true...')
    const state: webnative.AppState = await webnative.app({ useWnfs: true })
    console.log('Webnative app state:', state.scenario)

    switch (state.scenario) {
      case webnative.AppScenario.NotAuthed:
        console.log('User is not authenticated')
        sessionStore.set({
          username: '',
          authed: false,
          loading: false,
          backupCreated: null
        })
        console.log('Session store updated for unauthenticated user')
        break

      case webnative.AppScenario.Authed:
        console.log('User is authenticated with username:', state.username)
        console.log('Getting backup status...')
        backupStatus = await getBackupStatus(state.fs)
        console.log('Backup status:', backupStatus)

        sessionStore.set({
          username: state.username,
          authed: state.authenticated,
          loading: false,
          backupCreated: backupStatus.created
        })
        console.log('Session store updated for authenticated user')

        filesystemStore.set(state.fs)
        console.log('Filesystem store updated')
        break

      default:
        console.log('Unknown scenario:', state.scenario)
        break
    }
  } catch (error) {
    console.error('Error during initialization:', error)
    
    if (error === webnative.InitialisationError.InsecureContext) {
      console.error('Initialization error: Insecure Context')
      sessionStore.update(session => ({
        ...session,
        loading: false,
        error: 'Insecure Context'
      }))
    } else if (error === webnative.InitialisationError.UnsupportedBrowser) {
      console.error('Initialization error: Unsupported Browser')
      sessionStore.update(session => ({
        ...session,
        loading: false,
        error: 'Unsupported Browser'
      }))
    } else {
      console.error('Unhandled initialization error:', error)
      sessionStore.update(session => ({
        ...session,
        loading: false,
        error: 'Unsupported Browser' // Using a supported error type
      }))
    }
  }
}
