<script lang="ts">
  import { goto } from '$app/navigation'
  import { sessionStore } from '$src/stores'
  import AvatarUpload from '$components/settings/AvatarUpload.svelte'
  import ThemePreferences from '$components/settings/ThemePreferences.svelte'
</script>

{#if $sessionStore} <!-- Check if session object exists -->
  <div
    class="min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-160px)] pt-8 md:pt-16 flex flex-col items-start max-w-[690px] m-auto gap-10 pb-5 text-sm"
  >
    <h1 class="text-xl">Account Settings</h1>

    <div class="flex flex-col items-start justify-center gap-6">
      <div>
        <AvatarUpload />
      </div>

      <div>
        <h3 class="text-lg mb-4">Username</h3>
        <p>{$sessionStore?.username}</p> <!-- Add optional chaining -->
      </div>

      <div>
        <ThemePreferences />
      </div>

      <div>
        <h3 class="text-lg mb-4">Connected devices</h3>
        <!-- TODO: Re-implement backup/device status check. 
             The old '$sessionStore.backupCreated' is no longer valid.
             Need to use getBackupStatus or similar with the ODD FS. -->
        <!-- {#if $sessionStore.backupCreated}
          <p class="mb-4">
            You've already connected an additional device, but you can connect
            more.
          </p>
        {:else}
          <p class="mb-4">You have no other connected devices.</p>
        {/if} -->
        <p class="mb-4 text-neutral-500 italic">Device status check pending update.</p> 
        <a class="btn btn-primary" href="/delegate-account">
          Connect an additional device
        </a>
      </div>
    </div>
  </div>
{:else}
  {goto('/')}
{/if}
