import { get as getStore } from 'svelte/store'
import * as wn from 'webnative'
import * as uint8arrays from 'uint8arrays'
import { CID } from 'multiformats/cid'
import type { PuttableUnixTree, File as WNFile } from 'webnative/fs/types'
import type { Metadata } from 'webnative/fs/metadata'

import { filesystemStore, sessionStore } from '$src/stores'
import { AREAS, galleryStore } from '$routes/gallery/stores'
import { addNotification } from '$lib/notifications'

let username: string | null = null

// Subscribe to changes in the session store
sessionStore.subscribe(session => {
  username = session.username
})

export type Image = {
  cid: string
  ctime: number
  name: string
  private: boolean
  size: number
  src: string
}

export type Gallery = {
  publicImages: Image[] | null
  privateImages: Image[] | null
  selectedArea: AREAS
  loading: boolean
}

interface GalleryFile extends PuttableUnixTree, WNFile {
  cid: CID
  content: Uint8Array
  header: {
    content: Uint8Array
    metadata: Metadata
  }
}

type Link = {
  size: number
}

export const GALLERY_DIRS = {
  [AREAS.PUBLIC]: ['public', 'gallery'],
  [AREAS.PRIVATE]: ['private', 'gallery']
}
const FILE_SIZE_LIMIT = 5

/**
 * Get JSON objects from the user's WNFS and return them as an array
 */
export const getJSONFromWNFS: () => Promise<Array<Record<string, any>>> = async () => {
  try {
    // Set loading: true on the galleryStore
    galleryStore.update(store => ({ ...store, loading: true }))

    const { selectedArea } = getStore(galleryStore)
    const fs = getStore(filesystemStore)

    // Set path to gallery dir
    const path = wn.path.directory(...GALLERY_DIRS[selectedArea])

    // Get list of links for files in the gallery dir
    const links = await fs.ls(path)
    console.log('links', links)
  
    let cid
    Object.keys(links).forEach(name => {
      const link = links[name]
      console.log(link.cid.toString())
      if (link.toString() == 'tester.json') {
        cid = link.cid.toString()
      }
    })
  

    const jsonObjects = await Promise.all(
      Object.entries(links).map(async ([name, link]) => {
        const file = await fs.get(
          wn.path.file(...GALLERY_DIRS[selectedArea], `${name}`)
        )

        // The content of the file is a JSON-formatted string
        const jsonString = uint8arrays.toString((file as GalleryFile).content, 'utf8')

        // Parse the JSON-formatted string into a JavaScript object
        const jsonObject = JSON.parse(jsonString)

        // Get the CID for the current link and append it to the corresponding JSON object
        const cid = link.cid.toString()
        jsonObject.cid = cid
        console.log(jsonObject)

        return jsonObject
      })
    )

    // Sort JSON objects by ctime(created at date)
    // NOTE: this will eventually be controlled via the UI
    jsonObjects.sort((a, b) => b.ctime - a.ctime)

    // Set loading: false and return the JSON objects
    galleryStore.update(store => ({ ...store, loading: false }))
    return jsonObjects
  } catch (error) {
    console.error(error)
    galleryStore.update(store => ({ ...store, loading: false }))
    return []
  }
}

/**
 * Upload a JSON object to the user's private or public WNFS
 * @param json
 */
export const uploadJSONToWNFS: (
  json: Record<string, any>
) => Promise<void> = async json => {
  try {
    const { selectedArea } = getStore(galleryStore)
    const fs = getStore(filesystemStore)

    // Convert the JSON object to a string
    const jsonString = JSON.stringify(json)

    // Reject strings over 5MB
    const stringSizeInMB = new globalThis.Blob([jsonString]).size / (1024 * 1024)
    if (stringSizeInMB > FILE_SIZE_LIMIT) {
      throw new Error('JSON object can be no larger than 5MB')
    }

    // Reject the upload if the file already exists in the directory
    // const fileExists = await fs.exists(
    //   wn.path.file(...GALLERY_DIRS[selectedArea], `${username}.json`)
    // )
    // if (fileExists) {
    //   throw new Error(`${username}.json file already exists`)
    // }

    // Create a sub directory and add the JSON string as a file
    await fs.write(
      wn.path.file(...GALLERY_DIRS[selectedArea], `${username}.json`),
      new globalThis.Blob([jsonString], { type: 'application/json' })
    )

    // Announce the changes to the server
    await fs.publish()
    addNotification(`${username}.json file has been published`, 'success')
  } catch (error) {
    addNotification(error.message, 'error')
    console.error(error)
  }
}

/**
 * Delete an image from the user's private or public WNFS
 * @param name
 */
export const deleteImageFromWNFS: (
  name: string
) => Promise<void> = async name => {
  try {
    const { selectedArea } = getStore(galleryStore)
    const fs = getStore(filesystemStore)

    const imageExists = await fs.exists(
      wn.path.file(...GALLERY_DIRS[selectedArea], name)
    )

    if (imageExists) {
      // Remove images from server
      await fs.rm(wn.path.file(...GALLERY_DIRS[selectedArea], name))

      // Announce the changes to the server
      await fs.publish()

      addNotification(`${name} image has been deleted`, 'success')

      // Refetch images and update galleryStore
      await getJSONFromWNFS()
    } else {
      throw new Error(`${name} image has already been deleted`)
    }
  } catch (error) {
    addNotification(error.message, 'error')
    console.error(error)
  }
}

/**
 * Delete all JSON files from the user's private or public WNFS
 */
export const deleteAllJSONFromWNFS: () => Promise<void> = async () => {
  try {
    const { selectedArea } = getStore(galleryStore)
    const fs = getStore(filesystemStore)
    // Retrieve all JSON files in the selected directory
    const fileList = await fs.ls(wn.path.directory(...GALLERY_DIRS[selectedArea]))
    // Filter JSON files
    const jsonFiles = Object.keys(fileList).filter(key => key.endsWith('.json'))

    if (jsonFiles.length > 0) {
      // Remove JSON files from the server
      for (const fileName of jsonFiles) {
        console.log(fileName)
        await fs.rm(wn.path.file(...GALLERY_DIRS[selectedArea], fileName))
      }

      // Announce the changes to the server
      await fs.publish()

      addNotification(`Data has been deleted from IPFS`, 'success')

      // Refetch JSON files and update galleryStore
      await getJSONFromWNFS()
    } else {
      throw new Error(`No JSON files found to delete`)
    }
  } catch (error) {
    addNotification(error.message, 'error')
    console.error(error)
  }
}


/**
 * Handle uploads made by interacting with the file input directly
 */
export const handleFileInput: (
  files: FileList
) => Promise<void> = async files => {
  await Promise.all(
    Array.from(files).map(async file => {
      await uploadJSONToWNFS(file)
    })
  )

  // Refetch images and update galleryStore
  await getJSONFromWNFS()
}
