// import { isNullOrUndefined } from 'util'
import TerminusClient from '@terminusdb/terminusdb-client'

import * as fs from 'fs'

const WOQL = TerminusClient.WOQL

export async function generateKnowledgeGraph(ids: object[]): Promise<object> {
  const entities: { id: string; label: string; type: string }[] = []
  const relations: { source: string; target: string; type: string }[] = []
  for (const document of ids) {
    const orgid = 'Organization/' + document['id']
      let orgEntity = entities.find(entity => entity.id === orgid)
      if (!orgEntity) {
        entities.push({
          id: orgid,
          label: document['name'],
          type: 'organization'
        })
        orgEntity = entities[entities.length - 1]
      }

      if (document['assignee'] !== undefined) {
        const assigneeId = document['assignee'].replace(/^"|"$/g, '')
        if (assigneeId !== undefined && assigneeId !== '') {
          let assigneeEntity = entities.find(entity => entity.id === assigneeId)
          if (!assigneeEntity) {
            entities.push({
              id: assigneeId,
              label: document['name'] + ' assignee',
              type: 'attribute'
            })
            assigneeEntity = entities[entities.length - 1]
          }
          let assigneeRelation = relations.find(
            relation =>
              relation.source === orgid && relation.target === assigneeId
          )
          if (!assigneeRelation) {
            relations.push({
              source: orgid,
              target: assigneeId,
              type: 'assignee'
            })
          }
        }
      }

      const ecosystems = ['blockchainecosystem', 'web3', 'topic', 'impactarea']
for (const ecosystem of ecosystems) {
  let ecosystemValues = document[ecosystem]
  try {
    ecosystemValues = JSON.parse(ecosystemValues)
  } catch (error) {
    console.log(error)
  }
        if (Array.isArray(ecosystemValues)) {
          for (const ecosystemValue of ecosystemValues) {
            if(ecosystemValue === undefined) continue; 
            const ecosystemId = ecosystemValue.replace(/^"|"$/g, '')
            if (ecosystemId !== undefined && ecosystemId !== '') {
              let ecosystemEntity = entities.find(
                entity => entity.id === ecosystemId
              )
              if (!ecosystemEntity) {
                entities.push({
                  id: ecosystemId,
                  label: ecosystemValue,
                  type: 'attribute'
                })
                ecosystemEntity = entities[entities.length - 1]
              }
              let ecosystemRelation = relations.find(
                relation =>
                  relation.source === orgid && relation.target === ecosystemId
              )
              if (!ecosystemRelation) {
                relations.push({
                  source: orgid,
                  target: ecosystemId,
                  type: ecosystem
                })
              }
            }
          }
        } else {
          let ecosystemId = ecosystemValues
          // console.log(ecosystemId)
          if (ecosystemId !== undefined && ecosystemId !== '') {
            ecosystemId = ecosystemId.replace(/^"|"$/g, '')
            let ecosystemEntity = entities.find(
              entity => entity.id === ecosystemId
            )
            if (!ecosystemEntity) {
              entities.push({
                id: ecosystemId,
                label: document[ecosystem],
                type: 'attribute'
              })
              ecosystemEntity = entities[entities.length - 1]
            }
            let ecosystemRelation = relations.find(
              relation =>
                relation.source === orgid && relation.target === ecosystemId
            )
            if (!ecosystemRelation) {
              relations.push({
                source: orgid,
                target: ecosystemId,
                type: ecosystem
              })
            }
          }
        }
    }
  }
  return {
    entities: entities,
    relations: relations
  }
}

export default generateKnowledgeGraph
