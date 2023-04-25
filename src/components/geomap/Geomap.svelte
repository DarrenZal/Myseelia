<script lang="ts">
  import { onMount } from 'svelte'
  import { bubble } from 'svelte/internal'
  import TerminusClient from '@terminusdb/terminusdb-client'
  import { MeiliSearch } from 'meilisearch'


  //This was generate with ./json_graph.py
  //When a user searches, it regenerates the cytoscape graph using the Meilisearch index.  
  //To Do: incorporate actualy TerminusDB queries
  


  var searchTerm = ''
  function updateSearchTerm(e) {
    searchTerm = e.target.value
    // Perform search in real timebased on searchTerm here
  }


</script>

<section class="overflow-hidden text-gray-700">
  <div class="responsive-iframe-container">
    <iframe src="https://map.murmurations.network/?schema=organizations_schema-v1.0.0&tags=cascadia" title="Murmurations Map - Cascadia" style="border:none;"></iframe>
    <div class="search-container">
      <input
        id="search"
        type="text"
        placeholder="Search..."
        on:input={updateSearchTerm}
      />
    </div>
  </div>
</section>

<style>
  .search-container {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

#search {
  background-color: white;
  color: black;
  width: 50%;
  height: 40px;
  border-radius: 20px;
  padding: 10px 20px 10px 40px;
}

.responsive-iframe-container {
  position: relative;
  overflow: hidden;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.responsive-iframe-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
