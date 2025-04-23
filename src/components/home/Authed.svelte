<script lang="ts">
  import { sessionStore } from '../../stores'
</script>

<div
  class="min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-160px)] pt-8 md:pt-16 flex flex-col items-start max-w-[690px] m-auto gap-10 pb-5 text-sm"
>
  <h1 class="text-xl">Welcome, {$sessionStore?.username}!</h1>

  <!-- Removed ReFi Chat section -->

  <div class="flex flex-col items-start justify-center gap-5">
    <h2 class="text-lg">Manage Your Notes</h2>
    <p>
      Create, edit, and view your encrypted notes. Your data is secured using keys stored only in your browser and backed up via IPFS.
    </p>
     <a class="btn btn-primary" href="/notes">
      Go to Notes
    </a>
  </div>

   <div class="flex flex-col items-start justify-center gap-5">
    <h2 class="text-lg">Sync Another Device</h2>
    <p>
      Generate a QR code to securely transfer your account keys and data manifest CID to another device, allowing you to access your notes from multiple places.
    </p>
    <a class="btn btn-secondary" href="/sync">
      Sync Device
    </a>
  </div>
</div>
<style>

  .blue-link {
  
  color: blue;
  
  text-decoration: underline;
  
  cursor: pointer;
  
  }
  
  </style>
