<script lang="ts">
  import { appName } from '$lib/app-info'
</script>

<div
  class="min-h-[calc(100vh-96px)] flex flex-col items-start justify-center max-w-[700px] m-auto gap-6 pb-5 text-sm"
>
  <h1 class="text-xl">Welcome to {appName}</h1>
  <div class="max-w-[590px]">
    <p class="mb-5">
      A decentralized, end-to-end encrypted note-taking app using Web Crypto and IPFS.
      <br />
      Your keys and data stay on your device. Use the Register/Login button to create or access your identity.
      <br />
      <br />
      <!-- Keep Register/Login button -->
      <a class="btn btn-primary btn-sm !h-10 mr-2" href="/register">Register / Login</a>
      <!-- Add link to Notes page (will only work if logged in, but link can be present) -->
      <a class="btn btn-secondary btn-sm !h-10" href="/notes">Go to Notes</a>
    </p>
  </div>
</div>
