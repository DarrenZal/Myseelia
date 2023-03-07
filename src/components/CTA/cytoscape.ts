// import { isNullOrUndefined } from 'util'
import TerminusClient from '@terminusdb/terminusdb-client'

import * as fs from 'fs'

const WOQL = TerminusClient.WOQL

export async function generateKnowledgeGraph(ids: object[]): Promise<object> {
  console.log(ids)
  const entities: { id: string; label: string; type: string }[] = []
  const relations: { source: string; target: string; type: string }[] = []
  for (const document of ids) {
    const personid = 'Person/' + document['id']
    let personEntity = entities.find(entity => entity.id === personid)
    if (!personEntity) {
      entities.push({
        id: personid,
        label: document['name'],
        type: 'person'
      })
      personEntity = entities[entities.length - 1]
    }

    const linktypes = ['vouches_for', 'LI']
    for (const link of linktypes) {
      let linkValues = document[link]
      try {
        linkValues = JSON.parse(linkValues)
      } catch (error) {
        console.log(error)
      }
      if (Array.isArray(linkValues)) {
        for (const linkValue of linkValues) {
          if (linkValue === undefined) continue
          const linkId = linkValue.replace(/^"|"$/g, '')
          if (linkId !== undefined && linkId !== '') {
            let linkEntity = entities.find(
              entity => entity.id === linkId
            )
            if (!linkEntity) {
              entities.push({
                id: linkId,
                label: linkValue,
                type: 'attribute'
              })
              linkEntity = entities[entities.length - 1]
            }
            let linkRelation = relations.find(
              relation =>
                relation.source === personid && relation.target === linkId
            )
            if (!linkRelation) {
              relations.push({
                source: personid,
                target: linkId,
                type: link
              })
            }
          }
        }
      } else {
        let linkId = linkValues
        // console.log(linkId)
        if (linkId !== undefined && linkId !== '') {
          linkId = linkId.replace(/^"|"$/g, '')
          let linkEntity = entities.find(
            entity => entity.id === linkId
          )
          if (!linkEntity) {
            entities.push({
              id: linkId,
              label: document[link],
              type: 'attribute'
            })
            linkEntity = entities[entities.length - 1]
          }
          let linkRelation = relations.find(
            relation =>
              relation.source === personid && relation.target === linkId
          )
          if (!linkRelation) {
            relations.push({
              source: personid,
              target: linkId,
              type: link
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
