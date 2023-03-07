import csv
from itertools import islice
from schema import person
from terminusdb_client import WOQLClient
from datetime import datetime
import pytz
import re
import json
import meilisearch
import ast
import hashlib
import requests
import emoji

def get_emoji_regexp():
    # Sort emoji by length to make sure multi-character emojis are
    # matched first
    emojis = sorted(emoji.EMOJI_DATA, key=len, reverse=True)
    pattern = u'(' + u'|'.join(re.escape(u) for u in emojis) + u')'
    return re.compile(pattern)


def remove_emojis(string):
    return get_emoji_regexp().sub(r'', string)

# we keep all the information in dictionaries with Employee id as keys
orgs = {}
orgsjson = []

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="murmurations", team="Myseelia", use_token=True)

client1 = meilisearch.Client(
    'https://ms-9ea4a96f02a8-1969.sfo.meilisearch.io', '117c691a34b21a6651798479ebffd181eb276958')

def delete_index(index_name):
    try:
        index = client1.index(index_name)
        response = index.delete()
        print(response)
    except Exception as e:
        print(e)

delete_index('people')

index = client1.index('people')

# Define the endpoint and headers for the API request
endpoint = 'https://test-index.murmurations.network/v2/nodes'
headers = {'Content-Type': 'application/json'}

# # Load the input data from a file
# with open('murmuration_people.json', 'r') as f:
#     input_data = json.load(f)

# Load the input data from a URL
url = "https://test-index.murmurations.network/v2/nodes?schema=person_schema-v0.1.0"
input_data = requests.get(url).json()

# Extract the data field from the input data
response_data = input_data['data']

# Create a dictionary to keep track of the profile URLs that have already been processed
profile_urls = {}

# Create a dictionary to keep track of people based on their profile URL
people_dict = {}

# Create a list to store the people as `person` objects
people = []

for profile in response_data:
    # Define the data to be sent in the GET request
    endpoint = profile['profile_url']
    headers = {'accept': 'application/json'}
    
    # Send the GET request to retrieve the profile details
    response = requests.get(endpoint, headers=headers)

    if response.status_code == 200:
        # Parse the JSON data and extract the necessary information to create a `person` object
        json_data = response.json()
        name = json_data.get('name', None)
        description = json_data.get('description', None)
        primary_url = json_data.get('primary_url', None)
        image = json_data.get('image', None)
        locality = json_data.get('locality', None)
        profile_url = json_data.get('profile_url', None)

         # Check if the person is already in the database
        if profile_url in profile_urls:
            continue

        personname = remove_emojis(str(name))

        # Create a `Person` object with the extracted information and the people they know
        newperson = person(
            name=personname,
            description=str(description),
            primary_url=str(primary_url),
            image=str(image),
            locality=str(locality),
            vouches_for=set(),
            LI=set()
        )
        # if personname not blank 
        if personname != 'None':
            people_dict[personname] = newperson
            people.append(newperson)
            profile_urls[primary_url] = endpoint
    else:
        print(f"Error {response.status_code}: {response.reason}")

# Update the temporary person objects with missing information
for p in people:
    if not p.name or not p.description or not p.image or not p.locality or not p.vouches_for or not p.LI:
        profileurl = profile_urls[p.primary_url]
        response = requests.get(profileurl, headers={'accept': 'application/json'})
        if response.status_code == 200:
            json_data = response.json()
            p.name = json_data.get('name', None)
            p.description = json_data.get('description', '')
            p.image = json_data.get('image', '')
            p.locality = json_data.get('locality', '')
            p.vouches_for = set()
            p.LI = set()
            for person_data in json_data.get('knows', []):
                url = person_data.get('url')
                incommunity = False
                if url not in profile_urls.values():
                    continue
                print(person_data.get('name'))
                knowsname = person_data.get('name')
                relationship_type = person_data.get('type')
                if relationship_type == 'VOUCHES_FOR':
                    if knowsname in people_dict:
                        p.vouches_for.add(people_dict[knowsname])
                elif relationship_type == 'LI':
                    if knowsname in people_dict:
                        p.LI.add(people_dict[knowsname])
        else:
            print(f"Error {response.status_code}: {response.reason}")
            

BATCH_SIZE = 100

# Split the people list into batches
batches = [people[i:i+BATCH_SIZE] for i in range(0, len(people), BATCH_SIZE)]

# Insert each batch into TerminusDB
inserted = []
for batch in batches:
    print(batch)
    batch_inserted = client.insert_document(batch, commit_msg="Adding people")
    print("inserted")
    inserted.extend(batch_inserted)
document_ids = [doc_id for doc_id in inserted]

print("done inserting")

# Retrieve all documents at once
documents = client.query_document({"@type": "person"})

# Process each document
indexed_documents = []
for document in documents:
    real_id = document['@id']
    num_id = real_id.split("/")[-1]
    document = {k: json.dumps(v) for k, v in document.items() if k != '@id'}
    document.update({'id': num_id})
    indexed_documents.append(document)

# Add all indexed documents to the index at once
index.add_documents(indexed_documents)
