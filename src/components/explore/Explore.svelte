<script lang="ts">
  import cytoscape from 'cytoscape'
  import { onMount } from 'svelte'
  import { bubble } from 'svelte/internal'

  let cy
  let cyDiv

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
  

  
  import json_graph from './knowledge_graph.json';

  let knowledgeGraphJson: any = json_graph;

//       knowledgeGraphJson = await response.json()
  //     } else {
  //       alert(`HTTP-Error: ${response.status}`)
  //     }
  //   }

  let nodes: INode[] = []
  let edges: IEdge[] = []

  onMount(async () => {
    //await fetchData();
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

    let cy = cytoscape({
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
            "text-max-width": function(ele){ return Math.max(1, Math.ceil(ele.degree()/2)) * 30; },
            "font-size": function(ele){ return Math.max(1, Math.ceil(ele.degree()/2)) * 6; },
            'background-color': "#75f6df",
            'border-color': "#223152",
            'border-width': function(ele){ return Math.max(1, Math.ceil(ele.degree()/2)); },
            label: 'data(label)',
            width: function(ele){ return Math.max(1, Math.ceil(ele.degree()/2)) * 40; },
            height: function(ele){ return Math.max(1, Math.ceil(ele.degree()/2)) * 40; }
          }
        },
        {
          selector: 'edge',
          style: {
            "font-size": 20,
            width: 5,
            'line-color': "#223152",
            'target-arrow-color': "#223152",
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            "text-rotation": "autorotate",
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

    let toggle = true;
 

    // cy.off('tap', 'node', event => {
    //       const node = event.target;
    //       const nodeId = node.data('id');
    //       alert('unDisplay info for ' + nodeId);
    // });
    

    
 

    cy.on('tap', 'node', function(evt){
  var node = evt.target;
  var connectedEdges = node.connectedEdges();
  var connectedNodes = node.neighborhood().nodes();
  var allElements = cy.elements();
  var allNodes = cy.nodes();
  var allEdges = cy.edges();
  
  if (node.style("display") == "element") {
    // hide all nodes and edges except the selected node and its neighbors
    allNodes.style("display", "none");
    allEdges.style("display", "none");
    connectedNodes.style("display", "element");
    node.style("display", "element");
    connectedEdges.style("display", "element");
  } else {
    // show all nodes and edges
    allNodes.style("display", "element");
    allEdges.style("display", "element");
  }
});

// Reset the state when clicking away from the node
cy.on('tap', function(e){
  if (e.target === cy) {
    cy.nodes().style('display', 'element');
    cy.edges().style('display', 'element');
    cy.nodes().data('highlighted', false);
  }
});


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
</script>

<section class="overflow-hidden text-gray-700">
  <div class="pt-8 p-6 md:p-8 mx-auto" />

  <div id="cy" />
</section>

<style>
  #cy {
    width: 100%;
    height: 95%;
    position: absolute;
    top: 55px;
    left: 0px;
  }
</style>
