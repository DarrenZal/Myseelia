<script lang="ts">
  import '../global.css'
  import { addNotification } from '$lib/notifications'
  import { appDescription, appImageURL, appName, appURL } from '$lib/app-info'
  import { sessionStore, themeStore } from '../stores'
  // import { errorToMessage } from '$lib/session' // errorToMessage might need update for ODD errors
  // import { initialize } from '$lib/init' // Replaced by loadAccount
  import { loadAccount } from '$lib/auth/account' // Import new ODD init function
  import Header from '$components/Header.svelte'
  import Notifications from '$components/notifications/Notifications.svelte'
  import SidebarNav from '$components/nav/SidebarNav.svelte'
  import { onMount } from 'svelte'; // Import onMount
  import * as browser from '$lib/browser'; // Import browser utils
  import { importCredentialsFromSync } from '$lib/auth/account'; // Import sync function
  import { goto } from '$app/navigation'; // Import goto
  // Removed duplicate addNotification import

  // TODO: Update error handling for ODD session errors if needed
  // sessionStore.subscribe(session => {
  //   if (session?.error) { // Check if ODD session has an error property or handle errors differently
  //     const message = errorToMessage(session.error) 
  //     addNotification(message, 'error')
  //   }
  // })

  // Call loadAccount directly on component mount or script execution
  loadAccount(); // Keep normal loadAccount call

  // Add onMount hook to check for sync data after mount
  onMount(() => {
    if (browser.isBrowser() && window.location.hash.startsWith('#sync=')) {
      console.log('[Layout] Sync data found in URL fragment on mount.');
      const encodedData = window.location.hash.substring(6);
      try {
        const syncDataString = decodeURIComponent(encodedData);
        console.log('[Layout] Decoded sync data string:', syncDataString);
        // Use IIFE to handle async import within onMount
        (async () => {
            console.log('[Layout] Attempting credential import...');
            const importSuccess = await importCredentialsFromSync(syncDataString);
            console.log('[Layout] Import success status:', importSuccess);

            // Clear the hash from the URL
            console.log('[Layout] Clearing URL hash...');
            history.replaceState(null, '', window.location.pathname + window.location.search);
            console.log('[Layout] URL hash cleared.');

            if (importSuccess) {
              // Reload the page or redirect to ensure all components reflect the new state
              console.log('[Layout] Sync successful, reloading page...');
              window.location.reload(); // Simple reload might be sufficient
              // await goto('/', { replaceState: true, invalidateAll: true }); // Alternative: force reload/rerun load functions
            } else {
              console.error('[Layout] Sync import returned false.');
              // Error notification handled in importCredentialsFromSync
            }
        })();
      } catch (e) {
        console.error('[Layout] Failed to decode or parse sync data from URL:', e);
        addNotification('Invalid sync data in URL.', 'error');
         // Clear the hash
         console.log('[Layout] Clearing URL hash after error...');
         history.replaceState(null, '', window.location.pathname + window.location.search);
         console.log('[Layout] URL hash cleared after error.');
      }
    } else {
        console.log('[Layout] No sync data found in URL fragment on mount.');
    }
  });

</script>

<svelte:head>
  <title>{appName}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index,follow" />
  <meta name="googlebot" content="index,follow" />
  <meta name="description" content={appDescription} />
  <meta property="og:title" content={appName} />
  <meta property="og:description" content={appDescription} />
  <meta property="og:url" content={appURL} />
  <meta property="og:type" content="website" />
  <meta property="og:image" content={appImageURL} />
  <meta property="og:image:alt" content="WebNative Template" />
  <meta property="og:image:width" content="1250" />
  <meta property="og:image:height" content="358" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={appName} />
  <meta name="twitter:description" content={appDescription} />
  <meta name="twitter:image" content={appImageURL} />
  <meta name="twitter:image:alt" content={appName} />

  <!-- See https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs for description. -->
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<div data-theme={$themeStore} class="min-h-screen">
  <Notifications />
  <SidebarNav>
    <Header />
    <div class="px-4">
      <slot />
    </div>
  </SidebarNav>
</div>
