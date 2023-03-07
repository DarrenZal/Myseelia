from numpy import NaN
from terminusdb_client import WOQLClient
from terminusdb_client.woqlschema import WOQLSchema
from terminusdb_client.woqldataframe import result_to_df
import pandas as pd
import json

# For Terminus X, use the following
# client = WOQLClient("https://cloud.terminusdb.com/<Your Team>/")
# client.connect(db="demo_workshop", team="<Your Team>", use_token=True)

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="murmurations", team="Myseelia", use_token=True)

orgs_raw = client.query_document({"@type": "person"})
# team_marketing_raw = client.query_document({"@type": "Employee", "team": "marketing"})

df = result_to_df(orgs_raw)
# df_selected = df[0:20]
# df = df.head(100)
#df.to_csv('df.csv', index=False)
entities = []
relations = []

for i, row in df.iterrows():
    # Create an entity for the person
    entity = {'id': row['Document id'], 'label': row['name'], 'type': 'person'}
    # Add any additional properties that exist for the person
    for prop in ['description', 'image', 'locality', 'primary_url']:
        if prop in row and not pd.isna(row[prop]):
            entity[prop] = row[prop]
    entities.append(entity)
    
    # Create a relation for each knows relationship
    if isinstance(row['LI'], list) and len(row['LI']) > 0 and not pd.isna(row['LI'][0]):
        for j in row['LI']:
            relation = {'source': row['Document id'], 'target': j, 'type': 'LI'}
            relations.append(relation)
    elif not pd.isna(row['LI']):
        relation = {'source': row['Document id'], 'target': row['LI'], 'type': 'LI'}
        relations.append(relation)
        
    # Create a relation for each vouches_for relationship
    if isinstance(row['vouches_for'], list) and len(row['vouches_for']) > 0 and not pd.isna(row['vouches_for'][0]):
        for j in row['vouches_for']:
            relation = {'source': row['Document id'], 'target': j, 'type': 'vouches_for'}
            relations.append(relation)
    elif not pd.isna(row['vouches_for']):
        relation = {'source': row['Document id'], 'target': row['vouches_for'], 'type': 'vouches_for'}
        relations.append(relation)
    
        
knowledgeGraphJson = {
    'entities': entities,
    'relations': relations
}


with open("knowledge_graph.json", "w") as f:
    json.dump(knowledgeGraphJson, f)
