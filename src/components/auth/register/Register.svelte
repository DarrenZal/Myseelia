<script lang="ts">
  import { onMount } from 'svelte'; // Keep onMount if needed for other logic, remove if not
  import { appName } from '$lib/app-info'
  import { register } from '$lib/auth/account'
  import CheckIcon from '$components/icons/CheckIcon.svelte'
  import XIcon from '$components/icons/XIcon.svelte'
  import FilesystemActivity from '$components/common/FilesystemActivity.svelte'

  let username: string = ''
  let registrationSuccess = true
  let isRegistering = false

  const handleInput = (event: Event) => {
    const { value } = event.target as HTMLInputElement
    username = value
  }

  // Original registerUser function
  const registerUser = async () => {
    console.log('[Register.svelte] registerUser called'); // Keep log for now
    isRegistering = true
    registrationSuccess = true

    try {
      registrationSuccess = await register(username)
    } catch (error) {
        console.error("Error calling register function:", error);
        registrationSuccess = false;
    } finally {
       isRegistering = false
    }
  }

  // Remove onMount listener logic if it was only for debugging the click
  /*
  onMount(() => {
    const registerButton = document.getElementById('register-button');
    if (registerButton) {
      registerButton.addEventListener('click', registerUser);
      console.log('[Register.svelte] Added direct event listener to button.');
    } else {
       console.error('[Register.svelte] Could not find register button to attach listener.');
    }

    // Cleanup listener on component destroy (optional but good practice)
    return () => {
      if (registerButton) {
        registerButton.removeEventListener('click', registerUser);
        console.log('[Register.svelte] Removed direct event listener from button.');
      }
    };
  });
  */
</script>

{#if isRegistering}
  <FilesystemActivity activity="Initializing" />
{:else}
  <!-- Restore modal wrapper elements -->
  <input type="checkbox" id="register-modal" checked class="modal-toggle" />
  <div class="modal">
    <div class="modal-box w-narrowModal relative text-center">
      <a href="/" class="btn btn-xs btn-circle absolute right-2 top-2">✕</a>

      <div>
        <h3 class="mb-7 text-base">Choose a username</h3>
        <div class="relative">
          <input
            id="registration"
            type="text"
            placeholder="Enter a username (optional label)"
            class="input input-bordered focus:outline-none w-full px-3 block"
            on:input={handleInput}
          />
        </div>

        {#if !registrationSuccess}
          <label for="registration" class="label mt-1">
            <span class="label-text-alt text-error text-left">
              There was an issue registering your account. Please try again.
            </span>
          </label>
        {/if}

        <div class="text-left mt-3">
          <input
            type="checkbox"
            id="shared-computer"
            class="peer checkbox checkbox-primary border-2 border-base-content hover:border-orange-300 transition-colors duration-250 ease-in-out inline-grid align-bottom"
          />
          <label
            for="shared-computer"
            class="cursor-pointer ml-1 text-sm grid-inline"
          >
            This is a shared computer
          </label>
          <label
            for="registration"
            class="label mt-1 hidden peer-checked:block"
          >
            <span class="label-text-alt text-error text-left">
              For security reasons, {appName} doesn't support shared computers at
              this time.
            </span>
          </label>
        </div>

        <div class="mt-5">
           <!-- Restore Back button if desired, or leave removed -->
           <!-- <a class="btn btn-outline" href="/connect">Back</a> -->
           <!-- Restore original on:click handler -->
          <button
            id="register-button"
            type="button"
            class="ml-2 btn btn-primary"
            on:click={registerUser}
            disabled={isRegistering}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
