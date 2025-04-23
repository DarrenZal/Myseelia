<script lang="ts">
  import { onDestroy } from 'svelte'
  import { onMount } from 'svelte'
  import { get as getStore } from 'svelte/store' // Import get

  // Removed TerminusClient import
  import { sessionStore } from '$src/stores' // Removed filesystemStore
  import { AREAS, galleryStore } from '$routes/gallery/stores'
  // Import new functions and types
  import { getGalleryFiles, type GalleryFile } from '$routes/gallery/lib/gallery'
  // Removed FileUploadCard as it might not be needed here
  import ImageCard from '$routes/gallery/components/imageGallery/ImageCard.svelte'
  import ImageModal from '$routes/gallery/components/imageGallery/ImageModal.svelte'

  // Removed TerminusDB client initialization

  let username = $sessionStore?.username; // Add optional chaining
  // Removed unused state variables (bioregion, ecozone, etc.)


  onMount(async () => {
      // Removed TerminusDB connection/schema logic
      // Initial fetch of gallery files handled by sessionStore subscription below
  });

  /**
   * Open the ImageModal and pass it the selected `image` from the gallery
   * @param image
   */
  let selectedImage: GalleryFile | null = null // Use new type
  const setSelectedImage: (image: GalleryFile) => void = image => // Use new type
    (selectedImage = image)

  const clearSelectedImage = () => (selectedImage = null)

  // If galleryStore.selectedArea changes, re-run getGalleryFiles
  let currentSelectedArea: AREAS | null = null
  const unsubscribeGalleryStore = galleryStore.subscribe(async updatedStore => {
    // Initialize or check if area changed
    if (currentSelectedArea === null || currentSelectedArea !== updatedStore.selectedArea) {
      currentSelectedArea = updatedStore.selectedArea;
      console.log(`Chat Gallery: Selected area changed to: ${currentSelectedArea}. Refreshing gallery files...`); // Updated context log
      await getGalleryFiles(); // Fetch files for the new area
    }
  })

  // Fetch initial gallery files when user is authenticated
  let initialFetchDone = false;
  const unsubscribeSessionStore = sessionStore.subscribe((session) => {
    if (session?.isAuthenticated && !initialFetchDone) { // Check isAuthenticated flag
      initialFetchDone = true;
      console.log("Chat Gallery: User authenticated, fetching initial gallery files..."); // Updated context log
      getGalleryFiles(); // Fetch files for the default selected area
    }
  });

  onDestroy(() => {
    unsubscribeGalleryStore()
    unsubscribeSessionStore()
  })

  // Removed handleSubmit and makeConnection functions
</script>

<section class="overflow-hidden text-gray-700">
  <div class="pt-8 p-6 md:p-8 mx-auto">
     <!-- Content removed for debugging -->
     <p>Chat Image Gallery Placeholder</p>
  </div>
</section>

<!-- Style block removed -->
