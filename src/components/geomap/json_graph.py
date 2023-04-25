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
client.connect(db="playground3", team="Myseelia", use_token=True)

orgs_raw = client.query_document({"@type": "Organization"})
# team_marketing_raw = client.query_document({"@type": "Employee", "team": "marketing"})

df = result_to_df(orgs_raw)
# df_selected = df[0:20]
df = df.head(100)
#df.to_csv('df.csv', index=False)
entities = []
relations = []

for i, row in df.iterrows():
    entities.append({'id': row['Document id'], 'label': row['name'], 'type': 'organization'})
    
    if not isinstance(row['assignee'], float):
        assignee_id = row['assignee']
        if not pd.isna(assignee_id) and assignee_id not in ['', None]:
            entities.append({'id': assignee_id, 'label': row['assignee'], 'type': 'attribute'})
            relations.append({'source': row['Document id'], 'target': assignee_id, 'type': 'assignee'})
    
    if isinstance(row['blockchainecosystem'], list):
        for ecosystem in row['blockchainecosystem']:
            ecosystem_id = ecosystem
            if not pd.isna(ecosystem_id) and ecosystem_id not in ['', None]:
                entities.append({'id': ecosystem_id, 'label': ecosystem, 'type': 'attribute'})
                relations.append({'source': row['Document id'], 'target': ecosystem_id, 'type': 'blockchain ecosystem'})
    else:
        ecosystem_id = row['blockchainecosystem']
        if not pd.isna(ecosystem_id) and ecosystem_id not in ['', None]:
            entities.append({'id': ecosystem_id, 'label': row['blockchainecosystem'], 'type': 'attribute'})
            relations.append({'source': row['Document id'], 'target': ecosystem_id, 'type': 'blockchain ecosystem'})
        
    if isinstance(row['topic'], list):
        for topic in row['topic']:
            topic_id = topic
            if not pd.isna(topic_id) and topic_id not in ['', None]:
                entities.append({'id': topic_id, 'label': topic, 'type': 'attribute'})
                relations.append({'source': row['Document id'], 'target': topic_id, 'type': 'topic'})
    else:
        topic_id = row['topic']
        if not pd.isna(topic_id) and topic_id not in ['', None]:
            print(topic_id)
            entities.append({'id': topic_id, 'label': row['topic'], 'type': 'attribute'})
            relations.append({'source': row['Document id'], 'target': topic_id, 'type': 'topic'})
        
    if isinstance(row['web3'], list):
        for web3 in row['web3']:
            web3_id = web3
            if not pd.isna(web3_id) and web3_id not in ['', None]:
                entities.append({'id': web3_id, 'label': web3, 'type': 'attribute'})
                relations.append({'source': row['Document id'], 'target': web3_id, 'type': 'web3'})
    else:
        web3_id = row['web3']
        if not pd.isna(web3_id) and web3_id not in ['', None]:
            entities.append({'id': web3_id, 'label': row['web3'], 'type': 'attribute'})
            relations.append({'source': row['Document id'], 'target': web3_id, 'type': 'web3'})
        
knowledgeGraphJson = {
    'entities': entities,
    'relations': relations
}


with open("knowledge_graph.json", "w") as f:
    json.dump(knowledgeGraphJson, f)