<script lang="ts">
  import { onDestroy } from 'svelte'
  import { onMount } from 'svelte'

  import TerminusClient from "@terminusdb/terminusdb-client"
  import { filesystemStore, sessionStore } from '$src/stores'
  import { AREAS, galleryStore } from '$routes/gallery/stores'
  import { getJSONFromWNFS, uploadJSONToWNFS, deleteAllJSONFromWNFS, type Image } from '$routes/gallery/lib/gallery'
  import FileUploadCard from '$routes/gallery/components/upload/FileUploadCard.svelte'
  import ImageCard from '$routes/gallery/components/imageGallery/ImageCard.svelte'
  import ImageModal from '$routes/gallery/components/imageGallery/ImageModal.svelte'
  import { ipfsGatewayUrl } from '$lib/app-info';
  import { addNotification } from '$lib/notifications'
  import { MeiliSearch } from 'meilisearch'
  
  function extractPersonId(url: string): string {
  const personIdPattern = /person\/[a-zA-Z0-9]+/;
  const match = url.match(personIdPattern);

  return match ? match[0] : null;
}

interface Document {
  [key: string]: any;
}

type KeyValuePair = [string, unknown];

  const client = new TerminusClient.WOQLClient(
              "https://cloud.terminusdb.com/Myseelia",{
                user:"zaldarren@gmail.com",
                organization:"Myseelia",
                db: "murmurations",
                token: "dGVybWludXNkYjovLy9kYXRhL2tleXNfYXBpLzg5OTY0ZGI5OWFlYjQ1Zjc5OGM5ZTRiZWI2MzExOGJhZjhiOWRiOWNlOTJiNmU2NGI0NDEzZjIzNDFmOGVkMjc=_869e9bd2465ad84126151962994fcfa22d4b7ec9375edf16b4182e7f36e4b2b820075ba22e78f629e0691eddbeae6998a6504d5ce287aa1df2602cb556b58e1730b0b93feb0e9304"
              }
            );


  let username = $sessionStore.username;
  let bioregion = '';
  let ecozone = '';
  let affiliatedOrganizations = "Organization/8c8368b55dc80f18ba254771701f6d1bc79a3a90f127c28b3145a2c2204e97ce";
  let Name = '';
  let hasCredential = {};
  let cid
  let primary_url, profileImage, Description, terminusID

  onMount(async () => {
      await client.connect()
      // const schema = await client.getSchema("myseelia", "main")
      const queryTemplate = { "name": username }
        const tdbresult = await client.getDocument({"type":"person","as_list":true,"query":queryTemplate});
        console.log("Query Documents",tdbresult)
    if (tdbresult && tdbresult.length > 0){
        console.log("found documents")
        const doc = tdbresult[0]
        bioregion = doc.locality
        Name = doc.name
        primary_url = doc.primary_url
        profileImage = doc.image
        Description = doc.description   
      } else {
        console.log("no documents found")
      }
      try {
        const jsonObjects = await getJSONFromWNFS()
        console.log("jsonObjects", jsonObjects)
        // Find the JSON object with the username "tester"
        const usernameJSONObject = jsonObjects.find(obj => obj.name === username)

        // Log the CID of the "username.json" file to the console
        cid = usernameJSONObject ? usernameJSONObject.cid : null
        console.log("found it", cid)
        } catch (error) {
          console.error("no files fond on WNFS")
        }
  });

  /**
   * Open the ImageModal and pass it the selected `image` from the gallery
   * @param image
   */
  let selectedImage: Image
  const setSelectedImage: (image: Image) => void = image =>
    (selectedImage = image)

  const clearSelectedImage = () => (selectedImage = null)

  // If galleryStore.selectedArea changes from private to public, re-run getJSONFromWNFS
  let selectedArea = null
  const unsubscribeGalleryStore = galleryStore.subscribe(async updatedStore => {
    // Get initial selectedArea
    if (!selectedArea) {
      selectedArea = updatedStore.selectedArea
    }

    if (selectedArea !== updatedStore.selectedArea) {
      selectedArea = updatedStore.selectedArea
      await getJSONFromWNFS()
    }
  })

  // Once the user has been authed, fetch the images from their file system
  let imagesFetched = false
  const unsubscribeSessionStore = sessionStore.subscribe((newState) => {
    if (newState.authed && $filesystemStore && !imagesFetched) {
      imagesFetched = true
      // Get images from the user's public WNFS
      getJSONFromWNFS()
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
      let entryObj: {
  "@type": string;
  name: string;
  locality?: string;
  image?: string;
  primary_url?: string;
  description?: string;
} = {
  "@type": "person",
  name: username,
  ...(bioregion && { locality: String(bioregion) }),
  ...(profileImage && { image: String(profileImage) }),
  ...(primary_url && { primary_url: String(primary_url) }),
  ...(Description && { description: String(Description) })
};

    const murmurationSchema = {
      linked_schemas: ['person_schema-v0.1.0'],
      name: username,
      primary_url: primary_url,
      description: Description,
      image: profileImage,
      locality: bioregion,
    };

    console.log(JSON.stringify(murmurationSchema));

    //upload to IPFS
    await uploadJSONToWNFS(murmurationSchema)
    try {
        const jsonObjects = await getJSONFromWNFS()
        console.log(jsonObjects)
        // Find the JSON object with the username "tester"
        const usernameJSONObject = jsonObjects.find(obj => obj.name === username)

        // Log the CID of the "username.json" file to the console
        cid = usernameJSONObject ? usernameJSONObject.cid : null
        console.log("found it", cid)

        const url = "https://test-index.murmurations.network/v2/nodes";
        const data = {
          profile_url: `https://ipfs.${ipfsGatewayUrl}/ipfs/${cid}/userland`,
        };
        console.log(data.profile_url)
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          } else {
            addNotification(`profile has been indexed on murmurations`, 'success')
          }

          const result = await response.json();
          console.log("result from murmurations indexing: " + JSON.stringify(result));
        } catch (error) {
          console.error("Error posting data:", error);
        }

        } catch (error) {
          console.error(error)
        }

        
        const queryTemplate = { "name": username }
        const tdbresult = await client.getDocument({"type":"person","as_list":true,"query":queryTemplate});
        console.log("Query Documents",tdbresult)
        const searchclient = new MeiliSearch({
          host: 'https://ms-9ea4a96f02a8-1969.sfo.meilisearch.io',
          apiKey: '117c691a34b21a6651798479ebffd181eb276958'
        })
        const index = searchclient.index('people')
    if (tdbresult && tdbresult.length > 0){
        await client.deleteDocument({id:tdbresult[0]["@id"]});
        // const searchResult = await index.search(`id="${tdbresult[0]["@id"]}"`);

        //   // Return the document if found, otherwise return null
        //   return searchResult.hits.length > 0 ? searchResult.hits[0] : null;
        //update document
        console.log("updating")
        const result = await client.addDocument(entryObj);
        addNotification(`data has been added to knowledge graph`, 'success')
        console.log("added document", result)
        const addedID = extractPersonId(String(result))
        const queryTemplate = { "@id": addedID }
        const terminusperson = await client.getDocument({ type: 'person', as_list: true, query: queryTemplate });
        console.log("result   ", terminusperson);
        const real_id: string = terminusperson[0]['@id'];
        terminusID = real_id
        console.log("terminusID", terminusID)
        const num_id: string = real_id.split('/').pop() || '';

        // Create a new object without the '@id' key
        const newDocument: Document = Object.entries(terminusperson[0])
          .filter(([key]) => key !== '@id')
          .reduce<Document>((acc, [key, value]: KeyValuePair) => {
            acc[key] = value;
            return acc;
          }, {});

        // Update the document with the new 'id'
        newDocument['id'] = num_id;

        const newDocumentsArray = [newDocument];

        const searchResult = await index.addDocuments(newDocumentsArray);
        console.log("searchResult", searchResult)
      } else{
        console.log('adding doc')
        const addedPerson = await client.addDocument(entryObj);
        console.log("added document", addedPerson)
        addNotification(`profile has been added to knowledge graph`, 'success')
        const addedID = extractPersonId(String(addedPerson))
        terminusID = addedID
        console.log("terminusID", terminusID)
      }
      const entries2 = await client.getDocument({"graph_type":"instance","as_list":true,"type":"person"})
      console.log(entries2);
    }catch(err){
        console.error(err.message)
    }
  }

  const onDelete = async (e) => {
    e.preventDefault();
    deleteAllJSONFromWNFS();
    try {
        const jsonObjects = await getJSONFromWNFS()
        // Find the JSON object with the username "tester"
        const usernameJSONObject = jsonObjects.find(obj => obj.userName === 'tester')

        // Log the CID of the "username.json" file to the console
        cid = usernameJSONObject ? usernameJSONObject.cid : null
        } catch (error) {
          console.error(error)
        }
        console.log("deleting", terminusID);

        const deleted = await client.deleteDocument({id:terminusID});
        if (deleted){
          addNotification(`profile has been deleted from knowledge graph`, 'success')
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
      <label class="label dark:text-white">
        Name:
        <input
          class="input text-white dark:text-black"
          type="text"
          bind:value={username}
          readonly
        />
      </label>
      <br />
      <label class="label dark:text-white">
        Image:
        <input
          class="input text-white dark:text-black"
          type="text"
          bind:value={profileImage}
        />
      </label>
      <br />
      <label class="label dark:text-white">
        Bioregion / Locality:
        <input
          class="input text-white dark:text-black"
          type="text"
          bind:value={bioregion}
        />
      </label>
      <br />
      <label class="label dark:text-white">
        Ecozone:
        <input
          class="input text-white dark:text-black"
          type="text"
          bind:value={ecozone}
        />
      </label>
      <!-- <br />
      <label class="label dark:text-white">
        Affiliated organizations:
        <input
          class="input text-white dark:text-black"
          type="text"
          bind:value={affiliatedOrganizations}
        />
      </label> -->
      <br />
      <label class="label dark:text-white">
        Primary URL:
        <input
          class="input text-white dark:text-black"
          type="text"
          bind:value={primary_url}
        />
      </label>
      <br />
      <label class="label dark:text-white">
        Description:
        <input
          class="input text-white dark:text-black"
          type="text"
          bind:value={Description}
        />
      </label>
      <br />
      <button class="bg-blue-500 text-white dark:text-black" type="submit">
        Submit
      </button>
      <br />
      {#if cid !== null && cid !== undefined}
        <div class="my-2">
          <a
            href={`https://ipfs.${ipfsGatewayUrl}/ipfs/${cid}/userland`}
            target="_blank"
            class="underline mb-4 hover:text-slate-500 dark:text-white"
            title="Note, the data will be cached for a while on IPFS after deleting, Fission is not 'tombstoning' on their gateway and there is no 'hard delete' on IPFS."
          >
            View on IPFS
          </a>
        </div>
        <br />
        <button type="button" class="delete" on:click={onDelete}>Delete</button>
      {/if}
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

<style>
  form {
    display: grid;
    grid-template-columns: 1fr 3fr;
  }

  label {
    text-align: left;
  }

  input {
    background-color: rgb(255, 255, 255);
    border-radius: 4px;
    color: rgb(0, 0, 0);
  }

  button {
    background-color: #4caf50; /* Green */
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  .delete {
    background-color: red;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
</style>
