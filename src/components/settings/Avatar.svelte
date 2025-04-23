<script lang="ts">
  import { accountSettingsStore, sessionStore } from '$src/stores'
  // Import the new getAvatar function
  import { getAvatar } from '$lib/account-settings'

  export let size = 'large'

  const sizeClasses =
    size === 'large'
      ? 'w-[88px] h-[88px] text-[40px]'
      : 'w-[40px] h-[40px] text-sm'

  const loaderSizeClasses =
    size === 'large' ? 'w-[28px] h-[28px]' : 'w-[16px] h-[16px]'

  // Call the new function
  getAvatar()
</script>

{#if $accountSettingsStore.avatar}
  {#if $accountSettingsStore.loading}
    <div
      class="flex items-center justify-center object-cover rounded-full border-2 border-base-content {sizeClasses}"
    >
      <span
        class="animate-spin ease-linear rounded-full border-2 border-t-2 border-t-orange-300 border-base-content {loaderSizeClasses}"
      ></span> <!-- Added closing tag -->
    </div>
  {:else}
    <img
      class="object-cover rounded-full border-2 border-base-content {sizeClasses}"
      src={$accountSettingsStore.avatar.src}
      alt="User Avatar"
    />
  {/if}
{:else}
  <div
    class="flex items-center justify-center bg-base-content text-base-100 uppercase font-bold rounded-full {sizeClasses}"
  >
    {$sessionStore?.username?.[0]} <!-- Add optional chaining -->
  </div>
{/if}
