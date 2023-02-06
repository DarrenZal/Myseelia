from terminusdb_client import WOQLClient
from terminusdb_client.woqlschema import WOQLSchema
from terminusdb_client.woqldataframe import result_to_df

# For Terminus X, use the following
# client = WOQLClient("https://cloud.terminusdb.com/<Your Team>/")
# client.connect(db="demo_workshop", team="<Your Team>", use_token=True)

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="playground", team="Myseelia", use_token=True)

team_it_raw = client.query_document({"@type": "Organization", "@id": "NaN"})

team_it = result_to_df(team_it_raw)


print(team_it)
