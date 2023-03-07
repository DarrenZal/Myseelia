import requests
import json
import pandas as pd

# Define the endpoint and headers for the API request
endpoint = 'https://test-index.murmurations.network/v2/nodes'
headers = {'Content-Type': 'application/json'}

# Load the input data from a file
with open('murmuration_people.json', 'r') as f:
    input_data = json.load(f)

# Extract the data field from the input data
response_data = input_data['data']

# Loop through the response data and retrieve each profile's details with a curl request
profiles = []
for profile in response_data:
    # Define the data to be sent in the GET request
    endpoint = profile['profile_url']
    headers = {'accept': 'application/json'}

    # Send the GET request to retrieve the profile details
    response = requests.get(endpoint, headers=headers)
    response_data = response.json()
    print(response_data)
    profiles.append(response)

# Convert the profiles list to a Pandas dataframe
df = pd.DataFrame(profiles)


# Display the resulting dataframe
df.to_csv('output.csv', index=False)
