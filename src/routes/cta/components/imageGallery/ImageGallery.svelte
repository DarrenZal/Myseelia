<script lang="ts">
  import { onDestroy } from 'svelte'
  import { onMount } from 'svelte'

  import TerminusClient from "@terminusdb/terminusdb-client"
  import { filesystemStore, sessionStore } from '$src/stores'
  import { AREAS, galleryStore } from '$routes/gallery/stores'
  import { getImagesFromWNFS, type Image } from '$routes/gallery/lib/gallery'
  import FileUploadCard from '$routes/gallery/components/upload/FileUploadCard.svelte'
  import ImageCard from '$routes/gallery/components/imageGallery/ImageCard.svelte'
  import ImageModal from '$routes/gallery/components/imageGallery/ImageModal.svelte'

  const client = new TerminusClient.WOQLClient(
              "https://cloud.terminusdb.com/Myseelia",{
                user:"zaldarren@gmail.com",
                organization:"Myseelia",
                db: "Myseelia",
                token: "dGVybWludXNkYjovLy9kYXRhL2tleXNfYXBpLzg5OTY0ZGI5OWFlYjQ1Zjc5OGM5ZTRiZWI2MzExOGJhZjhiOWRiOWNlOTJiNmU2NGI0NDEzZjIzNDFmOGVkMjc=_869e9bd2465ad84126151962994fcfa22d4b7ec9375edf16b4182e7f36e4b2b820075ba22e78f629e0691eddbeae6998a6504d5ce287aa1df2602cb556b58e1730b0b93feb0e9304"
              }
            );

  let username = $sessionStore.username;
  let bioregion = '';
  let ecozone = '';
  let affiliatedOrganizations = "Organization/8c8368b55dc80f18ba254771701f6d1bc79a3a90f127c28b3145a2c2204e97ce";
  let givenName = '';
  let hasCredential = {};


  onMount(async () => {
      await client.connect()
      const schema = await client.getSchema("myseelia", "main")
  });

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

  

  function handleSubmit() {
    makeConnection();
  }

  export async function makeConnection(){
    try{
      const entryObj = 
    {
        "@type" : "Person",
        "userName"    : username,
        "givenName"    : givenName,
        "bioregion": bioregion,
        "ecozone": ecozone,
        "hasCredential": hasCredential,
        "affiliation": affiliatedOrganizations
    };
    if (username == entryObj.userName){
        await client.updateDocument(entryObj)
      } else{
        await client.addDocument(entryObj);
      }
      const entries2 = await client.getDocument({"graph_type":"instance","as_list":true,"type":"Person"})
      console.log(entries2);
    }catch(err){
        console.error(err.message)
    }
  }
</script>

<style>
  form {
  display: grid;
  grid-template-columns: 1fr 3fr;
}

label {
  text-align: left;
}

input{
  background-color: rgb(255, 255, 255);
  border-radius: 4px;
}

button{
  background-color: #4CAF50; /* Green */
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}
</style>

<section class="overflow-hidden text-gray-700">
  <div class="pt-8 p-6 md:p-8 mx-auto">
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:lg:grid-cols-6 gap-4"
    >
      {#each $galleryStore.selectedArea === AREAS.PRIVATE ? $galleryStore.privateImages : $galleryStore.publicImages as image}{/each}
    </div>
    <form on:submit|preventDefault={handleSubmit}>
      <label class="label dark:text-white">
        Given Name:
        <input class="input text-white dark:text-black" type="text" bind:value={givenName} />
      </label>
      <br />
      <label class="label dark:text-white">
        Bioregion:
        <input class="input text-white dark:text-black" type="text" bind:value={bioregion} />
      </label>
      <br />
      <label class="label dark:text-white">
        Ecozone:
        <input class="input text-white dark:text-black" type="text" bind:value={ecozone} />
      </label >
      <br />
      <label class="label dark:text-white">
        Has Credential:
        <input class="input text-white dark:text-black" type="text" bind:value={hasCredential} />
      </label >
      <br />
      <label class="label dark:text-white">
        Affiliated organizations: 
        <input class="input text-white dark:text-black" type="text" bind:value={affiliatedOrganizations}/>
      </label>
      <br />
      <button class="bg-blue-500 text-white dark:text-black" type="submit">Submit</button>
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
