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

# we keep all the information in dictionaries with Employee id as keys
orgs = {}
orgsjson = []

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="murmurations", team="Myseelia", use_token=True)

client1 = meilisearch.Client(
    'https://ms-9ea4a96f02a8-1969.sfo.meilisearch.io', '117c691a34b21a6651798479ebffd181eb276958')

index = client1.index('people')

# Define the endpoint and headers for the API request
endpoint = 'https://test-index.murmurations.network/v2/nodes'
headers = {'Content-Type': 'application/json'}

# Load the input data from a file
with open('murmuration_people.json', 'r') as f:
    input_data = json.load(f)

# Extract the data field from the input data
response_data = input_data['data']

# Loop through the response data and retrieve each profile's details with a curl request
people = []
person1 = person(
            name="alice",
            primary_url="https://test-index.murmurations.network",
        )
person2 = person(
            name="alice",
            primary_url="https://test-index.murmurations.network",
        )
person3 = person(
            name="bob",
            primary_url="https://test-index.murmurations.network3",
            LI={person1}
        )
person4 = person(
            name="steve",
            primary_url="https://test-index.murmurations.network4",
            LI={person2}
        )

people.append(person1)
people.append(person2)
people.append(person3)
people.append(person4)
inserted = client.insert_document(people, commit_msg="Adding people")

