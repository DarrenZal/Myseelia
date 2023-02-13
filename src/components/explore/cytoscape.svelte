import { isNullOrUndefined } from 'util';
import { WOQLClient } from 'terminusdb-client';
import { resultToDF } from 'terminusdb-client/woqldataframe';
import { DataFrame } from 'pandas';
import * as fs from 'fs';

const client = new WOQLClient("https://cloud.terminusdb.com/Myseelia/");
client.connect(db="playground3", team="Myseelia", use_token=true);

export async function generateKnowledgeGraph(ids: string[]) {
  const orgsRaw = client.query_document({ "@type": "Organization", "Document id": { "@in": ids } });

  const df = resultToDF(orgsRaw);

  const entities: {id: string, label: string, type: string}[] = [];
  const relations: {source: string, target: string, type: string}[] = [];

  for (let i = 0; i < df.length; i++) {
    const row = df[i];
    entities.push({'id': row['Document id'], 'label': row['name'], 'type': 'organization'});

    if (!isNullOrUndefined(row['assignee'])) {
      const assigneeId = row['assignee'];
      if (!isNullOrUndefined(assigneeId) && assigneeId !== '' && !isNaN(assigneeId)) {
        entities.push({'id': assigneeId, 'label': row['assignee'], 'type': 'attribute'});
        relations.push({'source': row['Document id'], 'target': assigneeId, 'type': 'assignee'});
      }
    }

    if (Array.isArray(row['blockchainecosystem'])) {
      for (const ecosystem of row['blockchainecosystem']) {
        const ecosystemId = ecosystem;
        if (!isNullOrUndefined(ecosystemId) && ecosystemId !== '' && !isNaN(ecosystemId)) {
          entities.push({'id': ecosystemId, 'label': ecosystem, 'type': 'attribute'});
          relations.push({'source': row['Document id'], 'target': ecosystemId, 'type': 'blockchain ecosystem'});
        }
      }
    } else {
      const ecosystemId = row['blockchainecosystem'];
      if (!isNullOrUndefined(ecosystemId) && ecosystemId !== '' && !isNaN(ecosystemId)) {
        entities.push({'id': ecosystemId, 'label': row['blockchainecosystem'], 'type': 'attribute'});
        relations.push({'source': row['Document id'], 'target': ecosystemId, 'type': 'blockchain ecosystem'});
      }
    }

  if (Array.isArray(row['topic'])) {
    for (const topic of row['topic']) {
      const topicId = topic;
      if (!isNullOrUndefined(topicId) && topicId !== '' && !isNaN(topicId)) {
        entities.push({'id': topicId, 'label': topic, 'type': 'attribute'});
        relations.push({'source': row['Document id'], 'target': topicId, 'type': 'topic'});
      }
    }
  } else {
    const topicId = row['topic'];
    if (!isNullOrUndefined(topicId) && topicId !== '' && !isNaN(topicId)) {
      entities.push({'id': topicId, 'label': row['topic'], 'type': 'attribute'});
      relations.push({'source': row['Document id'], 'target': topicId, 'type': 'topic'});
    }
  }

  if (Array.isArray(row['web3'])) {
    for (const web3 of row['web3']) {
      const web3Id = web3;
      if (!isNullOrUndefined(web3Id) && web3Id !== '' && !isNaN(web3Id)) {
        entities.push({'id': web3Id, 'label': web3, 'type': 'attribute'});
        relations.push({'source': row['Document id'], 'target': web3Id, 'type': 'web3'});
      }
    }
  } else {
    const web3Id = row['web3'];
    if (!isNullOrUndefined(web3Id) && web3Id !== '' && !isNaN(web3Id)) {
      entities.push({'id': web3Id, 'label': row['web3'], 'type': 'attribute'});
      relations.push({'source': row['Document id'], 'target': web3Id, 'type': 'web3'});
    }
  }
}

const knowledgeGraphJson = {
'entities': entities,
'relations': relations
};

fs.writeFileSync("knowledge_graph.json", JSON.stringify(knowledgeGraphJson), 'utf-8');

export function getData(client: WOQLClient, ids: string[]): DataFrame {
const query = {
"@type": "Organization",
"Document id": {
"$in": ids
}
};

const orgsRaw = client.query_document(query);
return resultToDF(orgsRaw);
}