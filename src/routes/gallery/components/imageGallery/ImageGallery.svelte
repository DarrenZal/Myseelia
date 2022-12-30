<script lang="ts">
  import { onDestroy } from 'svelte'

  import TerminusClient from "@terminusdb/terminusdb-client";
  import { filesystemStore, sessionStore } from '$src/stores'
  import { AREAS, galleryStore } from '$routes/gallery/stores'
  import { getImagesFromWNFS, type Image } from '$routes/gallery/lib/gallery'
  import FileUploadCard from '$routes/gallery/components/upload/FileUploadCard.svelte'
  import ImageCard from '$routes/gallery/components/imageGallery/ImageCard.svelte'
  import ImageModal from '$routes/gallery/components/imageGallery/ImageModal.svelte'

  /**
   * Open the ImageModal and pass it the selected `image` from the gallery
   * @param image
   */
  let selectedImage: Image
  const setSelectedImage: (image: Image) => void = image =>
    (selectedImage = image)

  const clearSelectedImage = () => (selectedImage = null)

  // If galleryStore.selectedArea changes from private to public, re-run getImagesFromWNFS
  let selectedArea = null
  const unsubscribeGalleryStore = galleryStore.subscribe(async updatedStore => {
    // Get initial selectedArea
    if (!selectedArea) {
      selectedArea = updatedStore.selectedArea
    }

    if (selectedArea !== updatedStore.selectedArea) {
      selectedArea = updatedStore.selectedArea
      await getImagesFromWNFS()
    }
  })

  // Once the user has been authed, fetch the images from their file system
  let imagesFetched = false
  const unsubscribeSessionStore = sessionStore.subscribe((newState) => {
    if (newState.authed && $filesystemStore && !imagesFetched) {
      imagesFetched = true
      // Get images from the user's public WNFS
      getImagesFromWNFS()
    }
  })

  onDestroy(() => {
    unsubscribeGalleryStore()
    unsubscribeSessionStore()
  })

  let bioregion = '';
  let ecozone = '';
  let skills = '';
  let interests = '';
  let associatedOrganizations = '';

  function handleSubmit() {
    alert("submitted");
    makeConnection();
  }

  export async function makeConnection(){
    try{
  const client = new TerminusClient.WOQLClient(
              "https://cloud.terminusdb.com/Myseelia",{
                user:"zaldarren@gmail.com",
                organization:"Myseelia",
                token: "dGVybWludXNkYjovLy9kYXRhL2tleXNfYXBpLzg5OTY0ZGI5OWFlYjQ1Zjc5OGM5ZTRiZWI2MzExOGJhZjhiOWRiOWNlOTJiNmU2NGI0NDEzZjIzNDFmOGVkMjc=_869e9bd2465ad84126151962994fcfa22d4b7ec9375edf16b4182e7f36e4b2b820075ba22e78f629e0691eddbeae6998a6504d5ce287aa1df2602cb556b58e1730b0b93feb0e9304"
              }
            );
      await client.connect()
      const schema = await client.getSchema("myseelia", "main")
      console.log("Schema");
      console.log(schema);
      const entries = await client.getDocument({"graph_type":"instance","as_list":true,"type":"Entry"})
      console.log("Entries");
      console.log(entries);
    }catch(err){
        console.error(err.message)
    }
  }
</script>

<section class="overflow-hidden text-gray-700">
  <div class="pt-8 p-6 md:p-8 mx-auto">
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:lg:grid-cols-6 gap-4"
    >
      {#each $galleryStore.selectedArea === AREAS.PRIVATE ? $galleryStore.privateImages : $galleryStore.publicImages as image}{/each}
    </div>
    <form on:submit|preventDefault={handleSubmit}>
      <label>
        Bioregion:
        <input type="text" bind:value={bioregion} />
      </label>
      <br />
      <label>
        Ecozone:
        <input type="text" bind:value={ecozone} />
      </label>
      <br />
      <label>
        Skills:
        <input type="text" bind:value={skills} />
      </label>
      <br />
      <label>
        Interests:
        <input type="text" bind:value={interests} />
      </label>
      <br />
      <label>
        Associated organizations:
        <input type="text" bind:value={associatedOrganizations} />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  </div>

  {#if selectedImage}
    <ImageModal
      image={selectedImage}
      isModalOpen={!!selectedImage}
      on:close={clearSelectedImage}
    />
  {/if}
</section>
