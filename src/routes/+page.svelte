<script lang="ts">
  import Authed from '$components/home/Authed.svelte'
  import Public from '$components/home/Public.svelte'
  import { sessionStore } from '$src/stores'
</script>

{#if $sessionStore.isAuthenticated} <!-- Check the isAuthenticated property -->
  <Authed />
{:else}
  <Public />
{/if}
