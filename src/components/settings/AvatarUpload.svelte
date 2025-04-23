<script lang="ts">
  // Import the renamed functions
  import { getAvatar, uploadAvatar } from '$lib/account-settings'
  import Avatar from '$components/settings/Avatar.svelte'

  /**
   * Handle uploads made by interacting with the file input
   */
  const handleFileInput: (file: File) => Promise<void> = async file => {
    // Call the renamed upload function
    await uploadAvatar(file)

    // Refetch avatar using the renamed function
    // Note: uploadAvatar already calls getAvatar internally, so this might be redundant,
    // but keeping it for now ensures the UI updates if uploadAvatar's internal call changes.
    await getAvatar()
  }

  // Handle a file uploaded directly through the file input
  let files: FileList
  $: if (files) {
    const file = Array.from(files)[0]
    handleFileInput(file)
  }
</script>

<h3 class="text-lg mb-4">Avatar</h3>
<div class="flex items-center gap-4">
  <Avatar />

  <label for="upload-avatar" class="btn btn-outline">Upload a new avatar</label>
  <input
    bind:files
    id="upload-avatar"
    type="file"
    accept="image/*"
    class="hidden"
  />
</div>
