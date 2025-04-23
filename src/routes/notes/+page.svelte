<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked'; // Import marked for rendering
  import DOMPurify from 'dompurify'; // Import DOMPurify for sanitizing rendered HTML
  import { notesStore, listNotes, loadNoteContent, saveNote, deleteNote, type Note } from '$lib/notes';
  import { sessionStore } from '$src/stores'; // To check if logged in
  import { addNotification } from '$lib/notifications';

  let currentContent = '';
  let currentTitle = '';
  let isEditing = false; // Flag to toggle between editor and rendered view
  let isSaving = false;
  let isLoadingContent = false;

  // Subscribe to store changes
  $: notes = $notesStore.notes;
  $: activeNote = $notesStore.activeNote;
  $: loadingList = $notesStore.loading; // Loading state for the list

  // Load notes list when the component mounts and user is authenticated
  onMount(() => {
    if ($sessionStore.isAuthenticated) {
      listNotes();
    }
  });

  // Load content only when the active note's path *changes*
  let activeNotePath: string | null = null; // Track the path of the loaded note
  $: if (activeNote?.path && activeNote.path !== activeNotePath) {
      console.log(`[Notes Page] Active note path changed to: ${activeNote.path}. Loading content.`);
      activeNotePath = activeNote.path; // Update the tracked path
      loadContent(activeNote);
  } else if (!activeNote && activeNotePath !== null) {
      // Handle deselection: Clear content and tracked path
      console.log('[Notes Page] Active note deselected.');
      activeNotePath = null;
    currentContent = '';
    currentTitle = '';
    isEditing = false;
  }

  async function loadContent(note: Note) {
    isLoadingContent = true;
    const content = await loadNoteContent(note);
    // Check if the active note is still the same one we started loading
    if ($notesStore.activeNote?.path === note.path) {
        currentContent = content || '';
        currentTitle = note.title;
        isEditing = false; // Default to view mode when loading a note
        isLoadingContent = false;
    } else {
         console.log("Active note changed while loading content, discarding result for", note.title);
         // isLoadingContent will be reset by the next loadContent call triggered by the reactive change
    }
  }

  function selectNote(note: Note) {
    // Prevent selecting the same note again if it's already active
    if ($notesStore.activeNote?.path !== note.path) {
        notesStore.update(s => ({ ...s, activeNote: note }));
    }
  }

  function createNewNote() {
    notesStore.update(s => ({ ...s, activeNote: null })); // Deselect current note
    currentTitle = '';
    currentContent = '';
    isEditing = true; // Start in edit mode for new note
  }

  async function handleSave() {
    if (!currentTitle.trim()) {
      addNotification('Please enter a title for the note.', 'error');
      return;
    }
    isSaving = true;
    const success = await saveNote(currentTitle, currentContent);
    if (success) {
      // Find the newly saved/updated note in the refreshed list and select it
      const savedNote = $notesStore.notes.find(n => n.title === currentTitle.trim());
      if (savedNote) {
        selectNote(savedNote); // Select the note after saving
      } else {
         // If not found immediately (shouldn't happen often), clear selection
         notesStore.update(s => ({ ...s, activeNote: null }));
      }
      isEditing = false; // Switch back to view mode after save
    }
    isSaving = false;
  }

  async function handleDelete() {
    if (!activeNote || !confirm(`Are you sure you want to delete "${activeNote.title}"?`)) {
      return;
    }
    await deleteNote(activeNote.path);
    // listNotes is called within deleteNote, store updates reactively
  }

  // Reactive variable for sanitized HTML rendering
  $: renderedHtml = isEditing || isLoadingContent ? '' : DOMPurify.sanitize(marked(currentContent || '') as string);

</script>

<svelte:head>
  <title>My Notes</title>
</svelte:head>

<div class="container mx-auto p-4 flex gap-4 h-[calc(100vh-100px)]"> <!-- Adjust height as needed -->

  <!-- Notes List Sidebar -->
  <div class="w-1/4 border-r pr-4 overflow-y-auto">
    <h2 class="text-xl font-semibold mb-4">Notes</h2>
    <button class="btn btn-primary btn-sm mb-4 w-full" on:click={createNewNote}>
      + New Note
    </button>
    {#if loadingList}
      <p>Loading notes...</p>
    {:else if notes.length === 0}
      <p class="text-gray-500">No notes yet.</p>
    {:else}
      <ul>
        {#each notes as note (note.path)}
          <li
            class="p-2 mb-1 rounded cursor-pointer hover:bg-base-200"
            class:bg-base-300={$notesStore.activeNote?.path === note.path}
            on:click={() => selectNote(note)}
          >
            {note.title}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Editor/Viewer Pane -->
  <div class="w-3/4 flex flex-col">
    {#if $notesStore.activeNote || isEditing} <!-- Show editor/viewer only if a note is active or creating new -->
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        {#if isEditing}
          <input
            type="text"
            placeholder="Note Title"
            class="input input-bordered input-sm text-lg font-semibold flex-grow mr-4"
            bind:value={currentTitle}
            disabled={isSaving}
          />
        {:else}
          <h2 class="text-xl font-semibold">{currentTitle || 'Untitled Note'}</h2>
        {/if}
        <div class="flex gap-2">
           {#if !isEditing && $notesStore.activeNote}
             <button class="btn btn-sm btn-error btn-outline" on:click={handleDelete} disabled={isSaving}>Delete</button>
           {/if}
           {#if isEditing}
             <button class="btn btn-sm btn-success" on:click={handleSave} disabled={isSaving || !currentTitle.trim()}>
               {#if isSaving} Saving... {:else} Save {/if}
             </button>
           {/if}
          <button
            class="btn btn-sm btn-outline"
            on:click={() => {
                console.log('[Notes Page] Edit/View button clicked. Current isEditing:', isEditing);
                isEditing = !isEditing;
                console.log('[Notes Page] New isEditing state:', isEditing);
            }}
            disabled={isSaving || isLoadingContent}
          >
            {isEditing ? 'View' : 'Edit'}
          </button>
        </div>
      </div>

      {#if isLoadingContent}
         <div class="flex-grow flex items-center justify-center">
            <span class="loading loading-spinner loading-lg"></span>
         </div>
      {:else if isEditing}
        <textarea
          class="textarea textarea-bordered w-full flex-grow text-base"
          placeholder="Start writing your note..."
          bind:value={currentContent}
          disabled={isSaving}
        ></textarea>
      {:else}
        <!-- Rendered Markdown View -->
        <div class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none flex-grow overflow-y-auto p-2 border rounded">
          {@html renderedHtml}
        </div>
      {/if}
    {:else}
      <div class="flex-grow flex items-center justify-center text-gray-500">
        <p>Select a note or create a new one.</p>
      </div>
    {/if}
  </div>

</div>
