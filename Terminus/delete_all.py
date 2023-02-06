from terminusdb_client import WOQLClient
import json

# we keep all the information in dictionaries with Employee id as keys
orgs = {}

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="playground", team="Myseelia", use_token=True)

with open("../src/components/explore/knowledge_graph.json") as json_file:
    data = json.load(json_file)
    entities = data.get("entities")
    for entity in entities:
        if entity.get("type") == "organization":
            id = entity.get("id")
            client.deleteDocument(id);
