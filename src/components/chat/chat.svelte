<script lang="ts">
  import { writable } from 'svelte/store';
  import axios from 'axios';

  const jsonData = {
  "OtherCompanies": [
    {
      "@context": "http://schema.org/",
      "@type": "Organization",
      "@id": "http://example.org/companies/BrightFutures",
      "name": "Bright Futures Ltd.",
      "industry": "wind energy",
      "investor": {"@id": "http://example.org/investors/PioneerInvestments"},
      "foundedYear": 2008,
      "location": "Hamburg, Germany"
    },
    {
      "@context": "http://schema.org/",
      "@type": "Organization",
      "@id": "http://example.org/companies/SunPowerTech",
      "name": "Sun Power Technologies",
      "industry": "photovoltaic energy",
      "investor": {"@id": "http://example.org/investors/NatureCapital"},
      "foundedYear": 2011,
      "location": "Zurich, Switzerland"
    },
    {
      "@context": "http://schema.org/",
      "@type": "Organization",
      "@id": "http://example.org/companies/WaveEnergySolutions",
      "name": "Wave Energy Solutions",
      "industry": "tidal energy",
      "investor": {"@id": "http://example.org/investors/InnovativeFunds"},
      "foundedYear": 2014,
      "location": "Dublin, Ireland"
    },
    {
      "@context": "http://schema.org/",
      "@type": "Organization",
      "@id": "http://example.org/companies/CleanTech",
      "name": "Clean Tech Innovations",
      "industry": "biomass energy",
      "products": [
        {"@id": "http://example.org/products/EcoFriendlyGadget1"},
        {"@id": "http://example.org/products/SustainableWidget1"}
      ],
      "impactScore": 90,
      "issuedBy": {"@id": "http://example.org/certifiers/EcoCertGlobal"},
      "investor": {"@id": "http://example.org/investors/GreenFunding"},
      "foundedYear": 2009,
      "location": "Vienna, Austria"
    }
  ],
  "Investors": [
    {
      "@context": "http://schema.org/",
      "@type": "Person",
      "@id": "http://example.org/investors/PioneerInvestments",
      "name": "Pioneer Investments",
      "investedIn": [
        {"@id": "http://example.org/companies/BrightFutures"},
        {"@id": "http://example.org/companies/CleanTech"}
      ],
      "location": "London, UK"
    },
    {
      "@context": "http://schema.org/",
      "@type": "Person",
      "@id": "http://example.org/investors/NatureCapital",
      "name": "Nature Capital Group",
      "investedIn": [
        {"@id": "http://example.org/companies/SunPowerTech"}
      ],
      "location": "Paris, France"
    },
    {
      "@context": "http://schema.org/",
      "@type": "Person",
      "@id": "http://example.org/investors/InnovativeFunds",
      "name": "Innovative Investment Funds",
      "investedIn": [
        {"@id": "http://example.org/companies/WaveEnergySolutions"}
      ],
      "location": "New York, USA"
    },
    {
      "@context": "http://schema.org/",
      "@type": "Person",
      "@id": "http://example.org/investors/GreenFunding",
      "name": "Green Funding LLC",
      "investedIn": [
        {"@id": "http://example.org/companies/CleanTech"},
        {"@id": "http://example.org/companies/BrightFutures"}
      ],
      "location": "San Francisco, USA"
    }
  ],
  "Products": [
    {
      "@context": "http://schema.org/",
      "@type": "Product",
      "@id": "http://example.org/products/EcoFriendlyGadget1",
      "name": "Eco-Friendly Gadget 1",
      "launchYear": 2020,
      "category": "Eco-Friendly Home",
      "manufacturer": {"@id": "http://example.org/companies/CleanTech"}
    },
    {
      "@context": "http://schema.org/",
      "@type": "Product",
      "@id": "http://example.org/products/SustainableWidget1",
      "name": "Sustainable Widget 1",
      "launchYear": 2021,
      "category": "Sustainable Tech",
      "manufacturer": {"@id": "http://example.org/companies/CleanTech"}
    }
  ],
  "CertifyingOrganizations": [
    {
      "@context": "http://schema.org/",
      "@type": "Organization",
      "@id": "http://example.org/certifiers/EcoCertGlobal",
      "name": "Eco Certification Global",
      "industry": "Sustainability Certification",
      "location": "Brussels, Belgium"
    }
  ]

  };

  const jsonDataString = JSON.stringify(jsonData, null, 2); // Indented with 2 spaces for formatting


  const messages = writable([]);
  let newMessage = '';
  let isLoading = writable(false); // To track loading state

  async function processSparqlResponse() {
    try {
        const sparqlResponse = await axios.post('https://myseelia.life/generate_query', { question: newMessage });
        console.log("SPARQL Response:", sparqlResponse.data);

        const sparqlResult = sparqlResponse.data.sparql_query; 
        const formattedSparqlResult = sparqlResult.map(item => {
            return Object.entries(item).map(([key, value]) => `${key}: ${value}`).join(', ');
        }).join('; ');
        messages.update(m => [...m, `SPARQL Result: ${formattedSparqlResult}`]);
    } catch (error) {
        console.error("Error processing SPARQL query:", error);
        messages.update(m => [...m, `Error: Could not process SPARQL query.`]);
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

        processSparqlResponse(); // Process SPARQL response independently
        processEntityMatchResponse(); // Process Entity Match response independently

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
</script>

<section id="indexed-data">
  <h2>Indexed DKG Data:</h2>
  <pre>{jsonDataString}</pre>
</section>
<section class="chat-container">
  <div class="messages">
    {#each $messages as message}
      <div class={`message ${message.startsWith('DKG Query:') ? 'query' : 'result'}`}>{message}</div>
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
    <button on:click={sendMessage} disabled={$isLoading}>Send</button>
    {#if $isLoading}
      <div class="loading">Loading...</div> <!-- Loading indicator -->
    {/if}
  </div>
</section>

<style>
  .chat-container {
    /* Your styles for the chat container */
  }
  .messages {
    /* Styles for the messages container */
  }
  .message {
    /* Styles for individual messages */
  }
  .message.query {
    background-color: #f0f8ff; /* Light blue background for queries */
    /* other styles for query messages */
  }

  .message.result {
    background-color: #f0fff0; /* Light green background for results */
    /* other styles for result messages */
  }
  .input-container {
    /* Styles for the input area */
    display: flex;
    align-items: center;
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
</style>
