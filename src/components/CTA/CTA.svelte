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

  import json_graph from './knowledge_graph.json'

  let knowledgeGraphJson: any = json_graph

  //       knowledgeGraphJson = await response.json()
  //     } else {
  //       alert(`HTTP-Error: ${response.status}`)
  //     }
  //   }

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

    // cy.off('tap', 'node', event => {
    //       const node = event.target;
    //       const nodeId = node.data('id');
    //       alert('unDisplay info for ' + nodeId);
    // });

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

    //   cy.on('tap', 'node', function(){
    //   alert("put code here"));
    //   });

    //   cy.layout({
    //     name: 'cola'
    //   }).run();
  })

  var searchTerm = ''
  function updateSearchTerm(e) {
    searchTerm = e.target.value
    // Perform search in real timebased on searchTerm here
  }

  async function entered(e) {
    const searchclient = new MeiliSearch({
      host: 'https://ms-9ea4a96f02a8-1969.sfo.meilisearch.io',
      apiKey: '117c691a34b21a6651798479ebffd181eb276958'
    })
    const index = searchclient.index('people')
    // this will search both keys and values
    // const search = await index.search(e.target.value.toString(), { q: '*' });
    // const searchResult = await index.search('orgs', {
    //   attributesToRetrieve: ['id']
    // })
    const searchResult = await index.search(e.target.value.toString())
    // need to turn the search results into an array of ids which can be used to query the knowledge graph
    const resultsgraph = await generateKnowledgeGraph(searchResult.hits).then(
      resultsgraph => {
        // console.log(resultsgraph)
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

<div class="pt-8 p-6 md:p-8 mx-auto">
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
    width: 50%;
    height: 40px;
    border-radius: 20px;
    padding: 10px 20px 10px 40px;
  }

  #search input[type='text'] {
    position: absolute;
    top: 0px;
    left: 50px;
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
