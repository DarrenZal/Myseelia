<script lang="ts">
  import { writable } from 'svelte/store'
  import axios from 'axios'
  import { sessionStore } from '$src/stores'

  // Initialize username as 'guest' by default
  let username = 'guest';

  // Reactive statement to update username if sessionStore changes
  $: {
    if ($sessionStore?.username) { // Add optional chaining
      username = $sessionStore.username;
    } else {
      username = 'guest';
    }
  }
  const messages = writable([])
  let newMessage = ''
  let isLoading = writable(false) // To track loading state
  let results = '' // Declare results here with initial empty string

  async function sendMessage() {
    if (newMessage.trim() !== '') {
      messages.update(m => [...m, `Query: ${newMessage}`])
      isLoading.set(true)

      let chatHistory = []

      // Send both the new message and the correct chat history
      const response = await axios.post('https://myseelia.life/query', {
        question: newMessage,
        history: chatHistory,
        username: username // Send username
      })
      console.log('Response:', response.data)

      let resultText = ''

      // Check if there is a result and then process the Text part
      if (response.data.result) {
        // Ensure resultText is always a string after assignment
        resultText = response.data.result.Text ?? ''; 
        
        // Check if resultText was originally an object with a nested Text field
        if (typeof response.data.result.Text === 'object' && response.data.result.Text?.Text) {
          resultText = response.data.result.Text.Text ?? '';
        }


        // Append Details to the result text if available
        if (
          response.data.result.Details &&
          response.data.result.Details.length > 0
        ) {
          const detailsText = response.data.result.Details.join('')
          // Ensure resultText is not null before appending
          resultText = (resultText ?? '') + (resultText ? '<br>' : '') + detailsText
        }
      }

      // Update messages or show 'No response received' if resultText is still empty
      if (!resultText) {
        messages.update(m => [...m, 'Result: No response received'])
      } else {
        messages.update(m => [...m, `Result: ${resultText}`]) // Removed @html here
      }

      newMessage = ''
      isLoading.set(false)
    }
  }

  function formatResultItem(item) {
    let formattedItem = []
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        let value = item[key].replace(/\"/g, '') // Removing quotes if present
        formattedItem.push(`${key}: ${value}`)
      }
    }
    return formattedItem.join(', ')
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  function getMessageType(message) {
    if (message.startsWith('Query:')) return 'query'
    if (message.startsWith('SPARQL Result:')) return 'sparql-result'
    if (message.startsWith('Entity Matching Result:'))
      return 'entity-matching-result'
    return 'other'
  }

  let feedbackMessage = ''

  async function sendFeedback() {
    if (feedbackMessage.trim() !== '') {
      // Send feedback to the server
      await axios.post('https://myseelia.life/feedback', {
        username: username,
        feedback: feedbackMessage
      })

      // Reset feedbackMessage
      feedbackMessage = ''
    }
  }

  function autoExpand(event) {
    const textarea = event.target
    textarea.style.height = 'auto' // Reset the height
    textarea.style.height = textarea.scrollHeight + 'px' // Set the height to match scroll height
  }
</script>

<!-- {#if username} -->
  <section class="chat-container">
    <div class="messages dark:text-white">
      {#each $messages as message}
        <div class={`message ${getMessageType(message)}`}>
          {@html message}
          <!-- Use @html here -->
        </div>
      {/each}
    </div>
    <div class="input-container">
      <textarea
        class="input auto-expand"
        placeholder="Type a message..."
        bind:value={newMessage}
        on:keydown={handleKeydown}
        on:input={autoExpand}
        rows="3"
        disabled={$isLoading}
      />
      <button on:click={sendMessage} disabled={$isLoading}>
        {#if $isLoading}Loading...{:else}Send{/if}
      </button>
      {#if $isLoading}
        <div class="loading">Processing...</div>
      {/if}
    </div>
  </section>
  <div class="feedback-container">
    <textarea
      class="input"
      placeholder="Leave your feedback..."
      bind:value={feedbackMessage}
      rows="3"
    />
    <button on:click={sendFeedback}>Submit Feedback</button>
  </div>
<!-- {:else}
  <div class="connect-prompt">
    <p>Please connect to create a username before chatting.</p>
  </div>
{/if} -->

<style>
  .messages {
    margin-bottom: 20px; /* Adds buffer of white space */
  }
  .input-container {
    /* Styles for the input area */
    display: flex;
    align-items: center;
    padding-bottom: 20px; /* Adds buffer of white space at the bottom */
  }
  .input-container button {
    width: 15%; /* Adjust as needed */
    height: 50px; /* Larger height */
    font-size: 16px; /* Larger font size */
    padding: 5px 10px;
  }
  .loading {
    font-size: 16px;
    color: #888888;
  }
  .feedback-container {
    display: flex;
    align-items: center;
    margin-top: 20px;
  }
  .feedback-container textarea,
  .input-container textarea {
    width: 80%;
    margin-right: 10px;
    font-size: 16px;
    padding: 10px;
    overflow-y: hidden; /* Prevent scrollbar */
    resize: none; /* Disable manual resize */
    height: auto; /* Set initial height to auto */
    min-height: 50px; /* Minimum height */
  }
  .feedback-container button {
    width: 15%;
    height: 50px;
    font-size: 16px;
    padding: 5px 10px;
  }
  .connect-prompt {
    margin-top: 20px;
    text-align: center;
    font-size: 18px;
  }
  input {
    background-color: rgb(255, 255, 255);
  }
  /* Add a class to handle the auto-expanding feature */
  .auto-expand {
    overflow-y: hidden;
  }

  /* JavaScript will adjust this height as the user types */
  .auto-expand::after {
    content: attr(data-replicated-value) ' ';
    white-space: pre-wrap;
    display: block;
    visibility: hidden;
  }
</style>
