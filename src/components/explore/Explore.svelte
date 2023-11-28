<script lang="ts">
  import cytoscape from 'cytoscape'
  import { onMount } from 'svelte'
  import { bubble } from 'svelte/internal'
  import TerminusClient from '@terminusdb/terminusdb-client'
  import { MeiliSearch } from 'meilisearch'
  import { generateKnowledgeGraph } from './cytoscape.ts'

  let cy

  interface INodeData {
    id: string
  }

  interface INode {
    data: INodeData
  }

  interface IEdgeData {
    id: string
    source: string
    target: string
    label: string
  }

  interface IEdge {
    data: IEdgeData
  }

  //This was generate with ./json_graph.py
  //When a user searches, it regenerates the cytoscape graph using the Meilisearch index.  
  //To Do: incorporate actualy TerminusDB queries
  import json_graph from './knowledge_graph.json'

  let knowledgeGraphJson: any = json_graph
  
  let nodes: INode[] = []
  let edges: IEdge[] = []

  onMount(async () => {
    nodes = knowledgeGraphJson.entities.map((entity: any) => ({
      data: { id: entity.id, label: entity.label }
    }))

    edges = knowledgeGraphJson.relations.map(
      (relation: any, index: string) => ({
        data: {
          id: index,
          source: relation.source,
          target: relation.target,
          label: relation.type
        }
      })
    )

    cy = cytoscape({
      container: document.getElementById('cy'),
      elements: {
        nodes,
        edges
      },
      style: [
        {
          selector: 'node',
          style: {
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': function (ele) {
              return Math.max(1, Math.ceil(ele.degree() / 2)) * 30
            },
            'font-size': function (ele) {
              return Math.max(1, Math.ceil(ele.degree() / 2)) * 6
            },
            'background-color': '#75f6df',
            'border-color': '#223152',
            'border-width': function (ele) {
              return Math.max(1, Math.ceil(ele.degree() / 2))
            },
            label: 'data(label)',
            width: function (ele) {
              return Math.max(1, Math.ceil(ele.degree() / 2)) * 40
            },
            height: function (ele) {
              return Math.max(1, Math.ceil(ele.degree() / 2)) * 40
            }
          }
        },
        {
          selector: 'edge',
          style: {
            'font-size': 20,
            width: 5,
            'line-color': '#223152',
            'target-arrow-color': '#223152',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'text-rotation': 'autorotate',
            'text-offset': { x: 20, y: -20 },
            'text-background-opacity': 1,
            'text-background-color': '#fafafa',
            'text-background-shape': 'roundrectangle',
            label: 'data(label)'
          }
        }
      ],
      layout: {
        name: 'cose'
        // infinite: true,
      }
    })

    cy.nodes().forEach(function (node) {
      node.data({
        degree: node.connectedEdges().length
      })
    })

    var nodes = cy.nodes()
    nodes = nodes.sort(function (a, b) {
      return b.data('degree') - a.data('degree')
    })

    var top100 = nodes.slice(0, 1000)

    //console.log(top100)

    cy.nodes().forEach(function (node) {
      if (!top100.includes(node)) {
        node.hide()
      }
    })

    let toggle = true

    cy.on('tap', 'node', function (evt) {
      var node = evt.target
      var connectedEdges = node.connectedEdges()
      var connectedNodes = node.neighborhood().nodes()
      var allElements = cy.elements()
      var allNodes = cy.nodes()
      var allEdges = cy.edges()

      if (node.style('display') == 'element') {
        // hide all nodes and edges except the selected node and its neighbors
        allNodes.style('display', 'none')
        allEdges.style('display', 'none')
        connectedNodes.style('display', 'element')
        node.style('display', 'element')
        connectedEdges.style('display', 'element')
      } else {
        // show all nodes and edges
        allNodes.style('display', 'element')
        allEdges.style('display', 'element')
      }
    })

    // Reset the state when clicking away from the node
    cy.on('tap', function (e) {
      if (e.target === cy) {
        cy.nodes().style('display', 'element')
        cy.edges().style('display', 'element')
        cy.nodes().data('highlighted', false)
      }
    })

    cy.on('tap', 'edge', event => {
      const edge = event.target
      const edgeId = edge.data('id')
      alert('Display info for ' + edgeId)
    })

  })

  var searchTerm = ''
  function updateSearchTerm(e) {
    searchTerm = e.target.value
    // Perform search in real timebased on searchTerm here
  }

  async function entered(e) {
    const searchclient = new MeiliSearch({
      host: 'https://ms-9ea4a96f02a8-1969.sfo.meilisearch.io',
      apiKey: '0a8740824e654411836da7ce15c4465996da8dfa9b2d68f603b50f9c80dc60b4'
    })
    const index = searchclient.index('orgs')
    // this will search both keys and values
    // const search = await index.search(e.target.value.toString(), { q: '*' });
    // const searchResult = await index.search('orgs', {
    //   attributesToRetrieve: ['id']
    // })
    const searchResult = await index.search(e.target.value.toString())
    const resultsgraph = await generateKnowledgeGraph(searchResult.hits).then(
      resultsgraph => {
        
        const allNodes = resultsgraph.entities.map((entity: any) => ({
          data: { id: entity.id, label: entity.label }
        }))

        const allEdges = resultsgraph.relations.map(
          (relation: any, index: string) => ({
            data: {
              id: index,
              source: relation.source,
              target: relation.target,
              label: relation.type
            }
          })
        )
        cy.remove(cy.elements())
        cy.add(allNodes)
        cy.add(allEdges)
        cy.layout({
          name: 'cose'
          // other layout options here
        }).run()
      }
    )

  }
</script>

<div class="flex justify-center items-center h-screen">
  <input
    id="search"
    type="text"
    placeholder="Search..."
    on:input={updateSearchTerm}
    on:keydown={event => {
      if (event.keyCode === 13) {
        entered(event)
      }
    }}
  />
</div>
<section class="overflow-hidden text-gray-700">
  <div class="cyDiv" />

  <div id="cy" />
</section>

<style>
  #search {
  position: absolute;
  top: 10px;
  z-index: 100;
  background-color: white;
  color: black;
  width: 50%;
  height: 40px;
  border-radius: 20px;
  padding: 10px 20px 10px 40px;
}

  #search input[type='text'] {
    position: absolute;
    top: 0px;
    width: 80%;
    height: 100%;
    border: none;
    background-color: transparent;
    font-size: 18px;
  }
  #cy-div {
    z-index: 99;
  }
  #cy {
    width: 100%;
    height: 95%;
    position: absolute;
    top: 55px;
    left: 0px;
  }
</style>
