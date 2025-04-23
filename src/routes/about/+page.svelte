<script lang="ts">
  import { appName } from '$lib/app-info';
</script>

<svelte:head>
  <title>About - {appName}</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-prose">
  <h1 class="h1">About {appName}</h1>

  <p>
    {appName} is a decentralized, end-to-end encrypted note-taking application.
    It demonstrates how to build modern web applications without relying on traditional backend servers for user accounts or data storage.
  </p>

  <h2 class="h2">How it Works</h2>

  <ul class="list-disc list-inside space-y-2">
    <li>
      <strong>Passwordless Authentication:</strong> Instead of passwords, {appName} uses cryptographic key pairs generated directly in your browser using the standard Web Crypto API. Your private key, which proves your identity and decrypts your data, never leaves your device unless you explicitly sync it using the QR code feature.
    </li>
    <li>
      <strong>Local Key Storage:</strong> Your cryptographic keys are securely stored in your browser's IndexedDB.
    </li>
    <li>
      <strong>Encrypted Storage via IPFS:</strong> Your notes are encrypted using AES-GCM before being stored. The encryption key for each note is itself encrypted using your public RSA key. This encrypted content and the encrypted key are then uploaded to the InterPlanetary File System (IPFS) via Pinata pinning service. Only someone with your private key can decrypt the AES key and then decrypt the note content.
    </li>
     <li>
      <strong>User Manifest:</strong> A JSON file, called a manifest, is stored on IPFS. This manifest contains your public key and metadata about your encrypted files (like their IPFS Content ID (CID), initialization vector (IV) for decryption, and the encrypted AES key). The CID of this manifest is stored in your browser's localStorage to locate your data.
    </li>
    <li>
      <strong>Device Syncing:</strong> You can sync your account to another device by scanning a QR code. This code contains your exported private key and the CID of your latest manifest, allowing the new device to access your encrypted data.
    </li>
    <li>
      <strong>SvelteKit Frontend:</strong> The user interface is built with SvelteKit, a modern web application framework.
    </li>
  </ul>

   <h2 class="h2">Technology Stack</h2>
   <ul class="list-disc list-inside space-y-1">
      <li>SvelteKit</li>
      <li>Tailwind CSS / daisyUI</li>
      <li>Web Crypto API (Browser Standard)</li>
      <li>IndexedDB (Browser Standard)</li>
      <li>IPFS (via Pinata)</li>
      <li>qrcode (for device sync)</li>
      <li>marked & DOMPurify (for Markdown rendering)</li>
   </ul>

  <p>
    This approach ensures that your data remains private and under your control, leveraging decentralized technologies for storage and standard browser APIs for cryptography.
  </p>

</div>
