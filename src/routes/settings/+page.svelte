<script lang="ts">
  import { sessionStore } from '$src/stores';
  import { accountSettingsStore } from '$src/stores';
  import AvatarUpload from '$components/settings/AvatarUpload.svelte';
  import ThemePreferences from '$components/settings/ThemePreferences.svelte';
  import { getCurrentManifest, updateManifest } from '$lib/auth/account'; // Import manifest functions
  import { addNotification } from '$lib/notifications';
  import { onMount } from 'svelte';

  let preferredUsername = '';
  let isSavingUsername = false;

  // Load current preferred username from manifest on mount
  onMount(async () => {
    const manifest = await getCurrentManifest();
    if (manifest?.username) {
      preferredUsername = manifest.username;
    } else {
      // If no preferred username, maybe show the default key-based one?
      // Or leave the input blank. Let's leave it blank for now.
      preferredUsername = '';
    }
  });

  async function saveUsername() {
    isSavingUsername = true;
    const newUsername = preferredUsername.trim(); // Trim whitespace

    // Basic validation (optional: add more complex rules)
    if (!newUsername) {
        addNotification('Username cannot be empty.', 'error');
        isSavingUsername = false;
        return;
    }
    // Optional: Check length, allowed characters etc.

    try {
        const manifest = await getCurrentManifest();
        if (!manifest) {
            throw new Error('Could not load user data to save username.');
        }

        // Check if username actually changed
        if (manifest.username === newUsername) {
            addNotification('Username is already set to this value.', 'info');
            isSavingUsername = false;
            return;
        }

        // Update the manifest object
        const updatedManifest = {
            ...manifest,
            username: newUsername,
        };

        // Save the updated manifest
        const success = await updateManifest(updatedManifest);

        if (success) {
            addNotification('Username updated successfully!', 'success');
            // Update the session store immediately for instant UI feedback
            sessionStore.update(s => ({ ...s, username: newUsername }));
        } else {
            // Error notification handled within updateManifest
             addNotification('Failed to save username.', 'error');
        }
    } catch (error) {
        console.error("Error saving username:", error);
        addNotification(`Error saving username: ${error.message}`, 'error');
    } finally {
        isSavingUsername = false;
    }
  }

</script>

<svelte:head>
  <title>Account Settings</title>
</svelte:head>

<div class="flex flex-col gap-10 max-w-prose">
  <h1 class="h1">Account Settings</h1>

  <!-- Username Section -->
  <div>
    <h2 class="h2 mb-4">Username</h2>
    <p class="text-sm mb-2">Set a preferred display name (optional).</p>
    <div class="flex items-center gap-2">
       <input
         type="text"
         placeholder="Enter preferred username"
         class="input input-bordered w-full max-w-xs"
         bind:value={preferredUsername}
         disabled={isSavingUsername}
       />
       <button
         class="btn btn-primary"
         on:click={saveUsername}
         disabled={isSavingUsername || preferredUsername === ($sessionStore.username === $accountSettingsStore.avatar?.name ? '' : $sessionStore.username)}
       >
         {#if isSavingUsername} Saving... {:else} Save Username {/if}
       </button>
    </div>
     <p class="text-xs mt-1 text-base-content/70">
        Your cryptographic identity remains tied to your keys. This username is just a display label.
     </p>
  </div>


  <!-- Avatar Section -->
  <div>
    <h2 class="h2">Avatar</h2>
    <AvatarUpload />
  </div>

  <!-- Theme Section -->
  <div>
    <h2 class="h2">Theme</h2>
    <ThemePreferences />
  </div>

</div>
