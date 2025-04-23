<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';
  import { sessionStore } from '$src/stores';
  import { exportCredentialsForSync, importCredentialsFromSync } from '$lib/auth/account';
  import { addNotification } from '$lib/notifications';
  import { goto } from '$app/navigation';
  // We'll add QR scanning later if needed

  let qrCodeDataUrl: string | null = null;
  let isLoadingQr = false;
  let errorMessage: string | null = null;

  // Reactive check for authentication
  $: isLoggedIn = $sessionStore.isAuthenticated;

  async function generateQrCode() {
    isLoadingQr = true;
    errorMessage = null;
    qrCodeDataUrl = null;
    const syncDataString = await exportCredentialsForSync();

    if (syncDataString) {
      try {
        // 1. Get base URL
        const baseUrl = window.location.origin;
        // 2. URL-encode the sync data
        const encodedSyncData = encodeURIComponent(syncDataString);
        // 3. Construct the full URL with fragment
        const fullSyncUrl = `${baseUrl}/#sync=${encodedSyncData}`;
        console.log("Generating QR code for URL:", fullSyncUrl);
        // 4. Generate QR code for the URL
        qrCodeDataUrl = await QRCode.toDataURL(fullSyncUrl, { errorCorrectionLevel: 'L', scale: 6 });
      } catch (err) {
        console.error('QR code generation failed:', err);
        errorMessage = 'Could not generate QR code.';
        addNotification(errorMessage, 'error');
      }
    } else {
      errorMessage = 'Could not retrieve sync data. Are you logged in?';
      // Notification already handled in exportCredentialsForSync
    }
    isLoadingQr = false;
  }

  // Generate QR code automatically if logged in when component mounts
  onMount(() => {
    if (isLoggedIn) {
      generateQrCode();
    }
  });

  // --- QR Code Scanning (Placeholder - requires library and UI) ---
  let isScanning = false;
  let scannedData: string | null = null;

  async function startScan() {
     addNotification('QR scanning not implemented yet.', 'info');
     // TODO: Implement QR scanning using a library like html5-qrcode
     // 1. Add a div with an ID (e.g., id="qr-reader") to the template below.
     // 2. Import Html5QrcodeScanner.
     // 3. Initialize the scanner in this function:
     //    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
     //    scanner.render(onScanSuccess, onScanFailure);
     //    isScanning = true;
  }

  async function onScanSuccess(decodedText: string, decodedResult: any) {
    console.log(`QR Code detected: ${decodedText}`);
    isScanning = false;
    // TODO: Stop the scanner instance if possible (scanner.clear()?)
    addNotification('QR Code Scanned. Importing...', 'info');
    const success = await importCredentialsFromSync(decodedText);
    if (success) {
        // Redirect to home page after successful sync/login
        goto('/');
    } else {
        // Error notification handled within importCredentialsFromSync
    }
  }

  function onScanFailure(error: any) {
    // Handle scan failure, usually ignore unless it's persistent
    // console.warn(`QR error = ${error}`);
  }

</script>

<svelte:head>
  <title>Sync Device</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-semibold mb-6">Sync Device</h1>

  {#if isLoggedIn}
    <div class="text-center p-4 border rounded-lg shadow">
      <h2 class="text-lg mb-4">Scan this QR Code with your other device</h2>
      <p class="text-sm mb-4 text-warning">Scanning this code will grant full access to your account. Do not share it publicly.</p>
      {#if isLoadingQr}
        <p>Generating QR Code...</p>
        <span class="loading loading-ring loading-lg"></span>
      {:else if qrCodeDataUrl}
        <img src={qrCodeDataUrl} alt="Device Sync QR Code" class="mx-auto border" />
      {:else if errorMessage}
        <p class="text-error">{errorMessage}</p>
        <button class="btn btn-primary mt-4" on:click={generateQrCode}>Retry</button>
      {/if}
       <button class="btn btn-outline mt-6" on:click={generateQrCode} disabled={isLoadingQr}>
         Regenerate Code
       </button>
    </div>
  {:else}
    <div class="text-center p-4 border rounded-lg shadow">
       <h2 class="text-lg mb-4">Scan QR Code from another device</h2>
       <p class="text-sm mb-4">Open this page on the device you want to sync TO. Then scan the QR code displayed on your already logged-in device.</p>

       <!-- Placeholder for QR Scanner UI -->
       <div id="qr-reader" class="w-full max-w-sm mx-auto my-4 border rounded bg-base-200 min-h-[250px] flex items-center justify-center">
         {#if isScanning}
           <p>Scanner active...</p>
         {:else}
           <p>(QR Scanner Area)</p>
         {/if}
       </div>

       <button class="btn btn-primary" on:click={startScan} disabled={isScanning}>
         {isScanning ? 'Scanning...' : 'Start Camera Scan'}
       </button>
       {#if scannedData}
         <p class="mt-4 text-success">Scanned! Importing...</p>
       {/if}
       <p class="text-xs mt-4">(QR Scanner functionality not yet implemented)</p>
    </div>
  {/if}

</div>
