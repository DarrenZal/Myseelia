from terminusdb_client import WOQLClient

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="murmurations", team="Myseelia", use_token=True)

# Query for all documents with type "person"
query = client.query_document({"@type": "person"})
ids = []
# Delete each document by its ID
for doc in list(query):
    ids.append(doc['@id'])
client.delete_document(ids)