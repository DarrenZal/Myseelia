<script lang="ts">
  import { writable } from 'svelte/store'
  import axios from 'axios'

  const messages = writable([])
  let newMessage = ''
  let isLoading = writable(false) // To track loading state
  let results = '' // Declare results here with initial empty string

  async function sendMessage() {
    if (newMessage.trim() !== '') {
      messages.update(m => [...m, `Query: ${newMessage}`])
      isLoading.set(true)

      let chatHistory = []

      // Ensure there are at least two messages (a query and a response)
      /* if ($messages.length >= 2) {
        // Extract the last query and response (excluding the current query)
        const lastQueryIndex = $messages.length - 2
        chatHistory = $messages
          .slice(lastQueryIndex - 1, lastQueryIndex + 1)
          .map(msg => {
            return {
              role: msg.startsWith('Query:') ? 'user' : 'assistant',
              content: msg.replace(/^Query: |^Result: /, '')
            }
          })
      } */

      // Send both the new message and the correct chat history
      const response = await axios.post('https://myseelia.life/query', {
        question: newMessage,
        history: chatHistory
      })
      console.log('Response:', response.data)

      let resultText = ''

      // Check if there is a result and then process the Text part
      if (response.data.result) {
        if (response.data.result.Text) {
          resultText = response.data.result.Text
          // Check if resultText is an object with a nested Text field
          if (typeof resultText === 'object' && resultText.Text) {
            resultText = resultText.Text
          }
        }

        // Append Details to the result text if available
        if (
          response.data.result.Details &&
          response.data.result.Details.length > 0
        ) {
          const detailsText = response.data.result.Details.join('')
          resultText += (resultText ? '<br>' : '') + detailsText
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
</script>

<section class="chat-container">
  <div class="messages">
    {#each $messages as message}
      <div class={`message ${getMessageType(message)}`}>
        {@html message} <!-- Use @html here -->
      </div>
    {/each}
  </div>
  <div class="input-container">
    <textarea
      placeholder="Type a message..."
      bind:value={newMessage}
      on:keydown={handleKeydown}
      rows="3"
      disabled={$isLoading}
    ></textarea>
    <button on:click={sendMessage} disabled={$isLoading}>
      {#if $isLoading}Loading...{:else}Send{/if}
    </button>
    {#if $isLoading}
      <div class="loading">Processing...</div>
    {/if}
  </div>
</section>

<style>
  .chat-container {
    margin-bottom: 20px; /* Adds buffer of white space */
  }
  .messages {
    /* Styles for the messages container */
  }
  .message {
    /* Styles for individual messages */
  }
  .message.query {
    color: #0000ff; /* Blue color for Query */
  }

  .message.sparql-result {
    color: #008000; /* Green color for SPARQL result */
  }

  .message.entity-matching-result {
    color: #0f2857; /* Orange color for Entity Matching Result */
  }
  .input-container {
    /* Styles for the input area */
    display: flex;
    align-items: center;
    padding-bottom: 20px; /* Adds buffer of white space at the bottom */
  }
  .input-container textarea {
    width: 80%; /* Adjust as needed */
    margin-right: 10px;
    font-size: 16px; /* Larger font size */
    padding: 10px;
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
</style>
