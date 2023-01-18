<script>
  import { writable } from 'svelte/store'
  import TerminusClient from '@terminusdb/terminusdb-client'

  // Connect and configure the TerminusClient
  const client = new TerminusClient.WOQLClient(
    'https://cloud.terminusdb.com/Myseelia',
    {
      user: 'zaldarren@gmail.com',
      organization: 'Myseelia',
      token:
        'dGVybWludXNkYjovLy9kYXRhL2tleXNfYXBpLzg5OTY0ZGI5OWFlYjQ1Zjc5OGM5ZTRiZWI2MzExOGJhZjhiOWRiOWNlOTJiNmU2NGI0NDEzZjIzNDFmOGVkMjc=_869e9bd2465ad84126151962994fcfa22d4b7ec9375edf16b4182e7f36e4b2b820075ba22e78f629e0691eddbeae6998a6504d5ce287aa1df2602cb556b58e1730b0b93feb0e9304'
    }
  )

  const bankerSchema = [
    {
      '@type': 'Class',
      '@id': 'BankAccount',
      '@key': {
        '@type': 'Hash',
        '@fields': ['account_id']
      },
      account_id: 'xsd:string',
      owner: 'Person',
      balance: 'xsd:decimal'
    },
    {
      '@type': 'Class',
      '@id': 'Person',
      '@key': {
        '@type': 'Lexical',
        '@fields': ['name']
      },
      name: 'xsd:string'
    }
  ]

  function handleSubmit() {
    alert('submitted')
    createDataProduct()
  }

  export async function createDataProduct() {
    try {
      //add the schema documents
      await client.addDocument(
        bankerSchema,
        { graph_type: 'schema' },
        'myseelia',
        'add new schema'
      )

      const accountObj = {
        '@type': 'BankAccount',
        account_id: 'DBZDFGET23456',
        owner: {
          '@type': 'Person',
          name: 'Tom'
        },
        balance: 1000
      }

      //add a document instance
      await client.addDocument(accountObj)

      client.getDocument({ as_list: true, id: 'Person/Tom' })
    } catch (err) {
      console.error(err.message)
    }
  }

  const fields = writable([]) // store to hold the schema fields

  // function to add a new field to the schema
  function addField(event) {
    event.preventDefault()
    const name = event.target.name.value
    const type = event.target.type.value
    fields.update(fields => [...fields, { name, type }])
    event.target.reset()
  }

  // function to delete a field from the schema
  function deleteField(index) {
    fields.update(fields => {
      fields.splice(index, 1)
      return fields
    })
  }

  // function to make an API call to add the schema to the database
  async function submitSchema() {
    const response = await fetch('/api/add-schema', {
      method: 'POST',
      body: JSON.stringify({ fields: fields.get() }),
      headers: { 'Content-Type': 'application/json' }
    })
    const result = await response.json()
    console.log(result)
  }
</script>

<h1>Add a schema</h1>

<form on:submit|preventDefault={addField}>
  <label for="name">Field Name:</label>
  <input type="text" name="name" required />
  <br />
  <label for="type">Field Type:</label>
  <select name="type">
    <option value="text">Text</option>
    <option value="number">Number</option>
    <option value="date">Date</option>
  </select>
  <br />
  <button type="submit">Add Field</button>
</form>

<table>
  <tr>
    <th>Field Name</th>
    <th>Field Type</th>
    <th>Action</th>
  </tr>
  {#each $fields as field, index}
    <tr>
      <td>{field.name}</td>
      <td>{field.type}</td>
      <td>
        <button on:click={() => deleteField(index)}>Delete</button>
      </td>
    </tr>
  {/each}
</table>

<button on:click={handleSubmit}>Submit Schema</button>

<style>
  /* add some styles for the schema editor */
  h1 {
    text-align: left;
  }
  form {
    display: flex;
    flex-direction: column;
    align-items: left;
  }
  label {
    margin: 0.5em 0;
  }
  input,
  select {
    margin: 0.5em 0;
    padding: 0.5em;
    width: 20ch; /* adjust width for inputting text of up to 20 characters */
  }
  button {
    margin: 0.5em 0;
    padding: 0.5em;
    width: 20ch; /* make the button the same width as the input fields */
    background-color: #0070f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background-color: #0052cc;
  }
  table {
    margin: 1em 0 1em 0; /* adjust top and bottom margins */
    border-collapse: collapse;
    width: 20ch; /* adjust width for inputting text of up to 20 characters */
    margin-left: 0; /* align the table to the left */
  }
  td,
  th {
    border: 1px solid #ddd;
    padding: 0.5em;
    text-align: left; /* align the columns to the left */
  }
  tr:nth-child(even) {
    background-color: #f2f2f2;
  }
</style>
