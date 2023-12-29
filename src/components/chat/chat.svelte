<script lang="ts">
  import { writable } from 'svelte/store';
  import axios from 'axios';

  const messages = writable([]);
  let newMessage = '';
  let isLoading = writable(false); // To track loading state

  async function processResponse() {
    try {
        const response = await axios.post('https://myseelia.life/query', { question: newMessage });
        console.log("Response:", response.data);

        messages.update(m => [...m, `Result: ${response.data.result}`]);
    } catch (error) {
        console.error("Error processing prompt:", error);
        messages.update(m => [...m, `Error: Could not process prompt.`]);
    }
  }

  async function processEntityMatchResponse() {
      try {
          const entityMatchResponse = await axios.post('https://myseelia.life/EntityMatchAnswer', { question: newMessage });
          console.log("Entity Matching Response:", entityMatchResponse.data);

          const entityMatchingResultText = entityMatchResponse.data.response.choices[0].message.content;
          messages.update(m => [...m, `Entity Matching Result: ${entityMatchingResultText}`]);
      } catch (error) {
          console.error("Error processing Entity Match query:", error);
          messages.update(m => [...m, `Error: Could not process Entity Match query.`]);
      }
  }

  async function sendMessage() {
  if (newMessage.trim() !== '') {
    messages.update(m => [...m, `Query: ${newMessage}`]);
    isLoading.set(true);

    // Extract chat history for sending to the backend
    let chatHistory = $messages.map(msg => {
      return { role: msg.startsWith('Query:') ? 'user' : 'assistant', content: msg };
    });

    // Send both the new message and the chat history
    const response = await axios.post('https://myseelia.life/query', { question: newMessage, history: chatHistory });
    console.log("Response:", response.data);

    messages.update(m => [...m, `Result: ${response.data.result}`]);

    newMessage = '';
    isLoading.set(false);
  }
}

  function formatResultItem(item) {
    let formattedItem = [];
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        let value = item[key].replace(/\"/g, ''); // Removing quotes if present
        formattedItem.push(`${key}: ${value}`);
      }
    }
    return formattedItem.join(', ');
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function getMessageType(message) {
    if (message.startsWith('Query:')) return 'query';
    if (message.startsWith('SPARQL Result:')) return 'sparql-result';
    if (message.startsWith('Entity Matching Result:')) return 'entity-matching-result';
    return 'other';
  }
</script>

<section class="chat-container">
  <div class="messages">
    {#each $messages as message}
      <div class={`message ${getMessageType(message)}`}>{message}</div>
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
