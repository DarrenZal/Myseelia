// import { isNullOrUndefined } from 'util'
import TerminusClient from '@terminusdb/terminusdb-client'

import * as fs from 'fs'

const client = new TerminusClient.WOQLClient(
  'https://cloud.terminusdb.com/Myseelia/',
  {
    user: 'zaldarren@gmail.com',
    organization: 'Myseelia',
    db: 'play',
    token:
      'dGVybWludXNkYjovLy9kYXRhL2tleXNfYXBpLzJkMDU4N2IwYjgzMzhmODdjMjc0ZDdiNmM1MzgwNjFmYTYyMmZkOTcyZTc3NjI1NzIyYjY3MTllYTE3NmQxYjE=_bd6f9c37d87abcaf0c16b7a68335b31010c8dd04aac0b07bf0f31676af131888666200aac080e72cdc746197334eac4f52d821c90652b5611784878afabe1267535cbd896a00a396'
  }
)
try {
  await client.connect()
  //console.log(schema);
  // console.log("result");

  // const result = await client.getDocument({as_list:true,type:"Person",query: { userName: "tester" }})
  // console.log(result);
} catch (err) {
  console.error('this is it' + err.message)
}

const WOQL = TerminusClient.WOQL

export async function generateKnowledgeGraph(ids: unknown[]): Promise<object> {
  const results: unknown[] = []
  const entities: { id: string; label: string; type: string }[] = []
  const relations: { source: string; target: string; type: string }[] = []
  for (const id of ids) {
    const orgid = 'Organization/' + id['id'].toString()
    const result = await client.getDocument({ as_list: true, type: 'Organization', id: orgid })
    for (const document of result) {
      let orgEntity = entities.find(entity => entity.id === orgid)
      if (!orgEntity) {
        entities.push({ 'id': orgid, 'label': document['name'], 'type': 'organization' })
        orgEntity = entities[entities.length - 1]
      }

      if (document['assignee'] !== undefined) {
        const assigneeId = document['assignee']
        if (assigneeId !== undefined && assigneeId !== '') {
          let assigneeEntity = entities.find(entity => entity.id === assigneeId)
          if (!assigneeEntity) {
            entities.push({ 'id': assigneeId, 'label': document['name'] + ' assignee', 'type': 'attribute' })
            assigneeEntity = entities[entities.length - 1]
          }
          let assigneeRelation = relations.find(relation => relation.source === orgid && relation.target === assigneeId)
          if (!assigneeRelation) {
            relations.push({ 'source': orgid, 'target': assigneeId, 'type': 'assignee' })
          }
        }
      }

      if (Array.isArray(document['blockchainecosystem'])) {
        for (const ecosystem of document['blockchainecosystem']) {
          const ecosystemId = ecosystem
          if (ecosystemId !== undefined && ecosystemId !== '') {
            let ecosystemEntity = entities.find(entity => entity.id === ecosystemId)
            if (!ecosystemEntity) {
              entities.push({ 'id': ecosystemId, 'label': ecosystem, 'type': 'attribute' })
              ecosystemEntity = entities[entities.length - 1]
            }
            let ecosystemRelation = relations.find(relation => relation.source === orgid && relation.target === ecosystemId)
            if (!ecosystemRelation) {
              relations.push({ 'source': orgid, 'target': ecosystemId, 'type': 'blockchain ecosystem' })
            }
          }
        }
      } else {
        const ecosystemId = document['blockchainecosystem']
        if (ecosystemId !== undefined && ecosystemId !== '') {
          let ecosystemEntity = entities.find(entity => entity.id === ecosystemId)
          if (!ecosystemEntity) {
            entities.push({ 'id': ecosystemId, 'label': document['blockchainecosystem'], 'type': 'attribute' })
            ecosystemEntity = entities[entities.length - 1]
          }
          let ecosystemRelation = relations.find(relation => relation.source === orgid && relation.target === ecosystemId)
          if (!ecosystemRelation) {
            relations.push({ 'source': orgid, 'target': ecosystemId, 'type': 'blockchain ecosystem' })
          }

        }
      }

        if (Array.isArray(document['topic'])) {
          for (const topic of document['topic']) {
            const topicId = topic
            if (topicId !== undefined && topicId !== '') {
              let topicEntity = entities.find(entity => entity.id === topicId)
              if (!topicEntity) {
                entities.push({ 'id': topicId, 'label': topic, 'type': 'attribute' })
                topicEntity = entities[entities.length - 1]
              }
              let topicRelation = relations.find(relation => relation.source === orgid && relation.target === topicId)
              if (!topicRelation) {
                relations.push({ 'source': orgid, 'target': topicId, 'type': 'topic' })
              }
            }
          }
        } else {
          const topicId = document['topic']
          if (topicId !== undefined && topicId !== '') {
            let topicEntity = entities.find(entity => entity.id === topicId)
            if (!topicEntity) {
              entities.push({ 'id': topicId, 'label': document['topic'], 'type': 'attribute' })
              topicEntity = entities[entities.length - 1]
            }
            let topicRelation = relations.find(relation => relation.source === orgid && relation.target === topicId)
            if (!topicRelation) {
              relations.push({ 'source': orgid, 'target': topicId, 'type': 'topic' })
            }
          }
        }
        
        if (Array.isArray(document['web3'])) {
          for (const web3 of document['web3']) {
            const web3Id = web3
            if (web3Id !== undefined && web3Id !== '') {
              let web3Entity = entities.find(entity => entity.id === web3Id)
              if (!web3Entity) {
                entities.push({ 'id': web3Id, 'label': web3, 'type': 'attribute' })
                web3Entity = entities[entities.length - 1]
              }
              let web3Relation = relations.find(relation => relation.source === orgid && relation.target === web3Id)
              if (!web3Relation) {
                relations.push({ 'source': orgid, 'target': web3Id, 'type': 'web3' })
              }
            }
          }
        } else {
          const web3Id = document['web3']
          if (web3Id !== undefined && web3Id !== '') {
            let web3Entity = entities.find(entity => entity.id === web3Id)
            if (!web3Entity) {
              entities.push({ 'id': web3Id, 'label': document['web3'], 'type': 'attribute' })
              web3Entity = entities[entities.length - 1]
            }
            let web3Relation = relations.find(relation => relation.source === orgid && relation.target === web3Id)
            if (!web3Relation) {
              relations.push({ 'source': orgid, 'target': web3Id, 'type': 'web3' })
            }
          }
        }

  

    }
  }


  return {
    'entities': entities,
    'relations': relations
  }

}

export default generateKnowledgeGraph


