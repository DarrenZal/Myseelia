// import { isNullOrUndefined } from 'util'
import TerminusClient from '@terminusdb/terminusdb-client'

import * as fs from 'fs'

const WOQL = TerminusClient.WOQL

function findNameById(ids: object[], id: string): string {
  console.log('finding id  ' + id);
  const document = ids.find(doc => 'person/' + doc['id'] === id);
  console.log('found name   ' + JSON.parse(document['name']));
  return document ? JSON.parse(document['name']) : '';
}

export async function generateKnowledgeGraph(ids: object[]): Promise<object> {
  const entities: { id: string; label: string; type: string }[] = []
  const relations: { source: string; target: string; type: string }[] = []

  for (const document of ids) {
    const personid = 'person/' + document['id']
    let personEntity = entities.find(entity => entity.id === personid)
    if (!personEntity) {
      entities.push({
        id: personid,
        label: typeof document['name'] === 'string' && document['name'].startsWith('"') && document['name'].endsWith('"') ? JSON.parse(document['name']) : document['name'],
        type: 'person'
      })
      personEntity = entities[entities.length - 1]
    }

    const linktypes = ['vouches_for', 'LI']
    for (const link of linktypes) {
      let linkValues = document[link];
      if (typeof linkValues === 'string') {
        try {
          linkValues = JSON.parse(linkValues);
        } catch (error) {
          console.error(`Error parsing JSON for link "${link}":`, error);
        }
      }
      if (Array.isArray(linkValues)) {
        for (const linkValue of linkValues) {
          if (linkValue === undefined) continue
          const linkId = linkValue.replace(/^"|"$/g, '')
          if (linkId !== undefined && linkId !== '' && linkId.startsWith('person/')) {
            let linkEntity = entities.find(
              entity => entity.id === linkId
            )
            if (!linkEntity) {
              entities.push({
                id: linkId,
                label: findNameById(ids, linkId),
                type: 'person'
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
        if (linkId !== undefined && linkId !== '' && linkId.startsWith('person/')) {
          linkId = linkId.replace(/^"|"$/g, '')
          let linkEntity = entities.find(
            entity => entity.id === linkId
          )
          if (!linkEntity) {
            entities.push({
              id: linkId,
              label: document[link],
              type: 'person'
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
