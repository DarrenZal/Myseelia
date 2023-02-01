<script lang="ts">
  import cytoscape from 'cytoscape';
  import { onMount } from 'svelte'

  let cy;
  let cyDiv;

  const createGraph = () => {
    cy = cytoscape({
      container: cyDiv,
      elements: [],
      style: [],
    });
  };

  interface INodeData {
  id: string;
}

interface INode {
  data: INodeData;
}

interface IEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface IEdge {
  data: IEdgeData;
}

let knowledgeGraphJson: any = {
	"entities": [{
		"label": "Organization",
		"title": "Neuralink"
	}, {
		"label": "Organization",
		"title": "SpaceX"
	}, {
		"label": "Organization",
		"title": "Pretoria"
	}, {
		"label": "Organization",
		"title": "The Boring Company"
	}, {
		"label": "Organization",
		"title": "University of Pretoria"
	}, {
		"label": "Organization",
		"title": "Stanford University"
	}, {
		"label": "Person",
		"title": "Jeff Bezos"
	}, {
		"label": "Organization",
		"title": "University of Pennsylvania"
	}, {
		"label": "Person",
		"title": "Kimbal Musk"
	}, {
		"label": "Organization",
		"title": "Tesla, Inc."
	}, {
		"label": "Person",
		"title": "Elon Musk"
	}],
	"relations": [{
		"source": "Elon Musk",
		"target": "Neuralink"
	}, {
		"source": "Tesla, Inc.",
		"target": "Elon Musk",
		"type": "owned by"
	}, {
		"source": "Elon Musk",
		"target": "University of Pennsylvania",
		"type": "residence"
	}, {
		"source": "Elon Musk",
		"target": "Tesla, Inc.",
		"type": "owned by"
	}, {
		"source": "The Boring Company",
		"target": "Tesla, Inc.",
		"type": "owned by"
	}, {
		"source": "Elon Musk",
		"target": "Kimbal Musk",
		"type": "sibling"
	}, {
		"source": "University of Pennsylvania",
		"target": "Elon Musk",
		"type": "residence"
	}, {
		"source": "The Boring Company",
		"target": "Neuralink",
		"type": "subsidiary"
	}, {
		"source": "Elon Musk",
		"target": "University of Pretoria",
		"type": "work location"
	}, {
		"source": "The Boring Company",
		"target": "Elon Musk",
		"type": "owned by"
	}, {
		"source": "Kimbal Musk",
		"target": "Elon Musk",
		"type": "sibling"
	}, {
		"source": "Neuralink",
		"target": "Elon Musk",
		"type": "owned by"
	}, {
		"source": "Elon Musk",
		"target": "The Boring Company",
		"type": "owned by"
	}, {
		"source": "Elon Musk",
		"target": "University of Pennsylvania",
		"type": "work location"
	}]
};

async function fetchData() {
  const response = await fetch('./data.json');
  if (response.ok) {
    knowledgeGraphJson = await response.json();
  } else {
    alert(`HTTP-Error: ${response.status}`);
  }
}

let nodes: INode[] = [];
let edges: IEdge[] = [];

  onMount(async () => {
    console.log("1");
    cyDiv = document.getElementById('cy');
    console.log("2");

    //await fetchData();

    console.log(knowledgeGraphJson);

  nodes = knowledgeGraphJson.entities.map((entity: any) => ({
    data: { id: entity.title },
  }));

  edges = knowledgeGraphJson.relations.map((relation: any, index: string) => ({
    data: {
      id: index,
      source: relation.source,
      target: relation.target,
      label: relation.type,
    },
  }));


  console.log(edges);
  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: {
      nodes,
      edges,
    },
    style: [
      {
        selector: 'node',
        style: {
          'text-valign': 'center',
          'text-halign': 'center',
          label: 'data(id)',
          width: 100,
          height: 100,
        },
      },
      {
        selector: 'edge',
        style: {
          width: 5,
          'line-color': 'light grey',
          'target-arrow-color': 'grey',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: 'data(label)',
        },
      },
    ],
  });

  cy.layout({
    name: 'cose',
  }).run();
  });
</script>

<style>
  #cy {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 55px;
    left: 0px;
  }
</style>


<section class="overflow-hidden text-gray-700">
  <div class="pt-8 p-6 md:p-8 mx-auto">

  </div>

  <div id="cy"></div>

</section>




