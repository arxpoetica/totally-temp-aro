/**
 * Holds a graph of the fiber routes displayed in the map (alongwith google maps feature objects)
 */
app.factory('fiberGraph', (state) => {

  // Class to represent a node in a graph
  class Node {
    constructor(nodeId) {
      this._nodeId = nodeId
      this._inEdges = []
      this._outEdges = []
    }

    // Adds an edge that points in to this node
    addInEdges(inEdge) {
      this._inEdges.push(inEdge)
    }

    // Adds an edge that points out of this node
    addOutEdges(outEdge) {
      this._outEdges.push(outEdge)
    }

    // Gets the edges that point out of this node
    getOutEdges() {
      return this._outEdges
    }

    // Gets the edges that point towards  this node
    getInEdges() {
      return this._inEdges
    }
  }

  // Class to represent an edge in a graph
  class Edge {
    constructor(edgeId, fromNode, toNode, feature,type) {
      this._edgeId = edgeId
      this._fromNode = fromNode
      this._toNode = toNode
      this._feature = { type: 'Feature', geometry: JSON.parse(feature)};
      this._type = type;

      this._feature.properties = {
        isUpwardRoute : true,
        id: this._edgeId
      }

    }

    // Returns the 'to' node for this edge
    getToNode() {
      return this._toNode
    }

    // Returns the 'from' node for this edge
    getFromNode() {
      return this._fromNode
    }

    getEdgeId(){
      return this._edgeId;
    }

    // Returns the google maps feature object associated with this edge
    getFeature() {
      return this._feature
    }

    //get type of link "feeder" "distribution
    getType() {
      return this._type;
    }
  }


  // Class to represent the graph
  class Graph {
    constructor() {
      this._nodes = {}
      this._edges = {}
    }

    // Gets the number of edges in the graph
    getNumEdges() {
      return Object.keys(this._edges).length
    }

    // Gets the edge specified by the given edge id
    edge(edgeId) {
      return this._edges[edgeId]
    }

    // Adds a node with the specified node id. If the node already exists, does nothing
    addNode(nodeId) {
      if (!this._nodes[nodeId]) {
        this._nodes[nodeId] = new Node(nodeId)
      }
    }

    // Adds an edge with the given id between two nodes with the given id, and saves the feature object in the edge.
    // If the nodes do not exist, they are created
    addEdge(edgeId, fromNodeId, toNodeId, feature , type) {
      this.addNode(fromNodeId)
      this.addNode(toNodeId)
      if (!this._edges[edgeId]) {
        this._edges[edgeId] = new Edge(edgeId, this._nodes[fromNodeId], this._nodes[toNodeId], feature , type)
        this._nodes[fromNodeId].addOutEdges(this._edges[edgeId])
        this._nodes[toNodeId].addInEdges(this._edges[edgeId])
      }
    }
  }

  // Start describing the service
  class FiberGraph {

    // Constructor
    constructor() {
      this.clear()
      this.ansCounter = 0;
      this.desCounter = 0;
    }

    // Clear everything in the graph service
    clear() {
      this._graph = new Graph()
    }

    // Adds an edge to the fiber graph
    addEdge(edgeId, fromNodeId, toNodeId, feature , type) {
      this._graph.addEdge(edgeId, fromNodeId, toNodeId, feature , type)
    }

    // Given an edgeId, find the successor edges that are connected to it, and then returns the
    // features associated with those successor edges. Used to find a list of all edges that
    // connect a given edgeId to the central office.
    // Assumes that there is exactly one edge between any two nodes
    getAncestorEdgeFeatures(edgeId) {
      this.ansCounter = 0;
      var edgeForFiber = this._graph.edge(edgeId)
      if (!edgeForFiber) {
        return []
      }
      var successorEdgeFeatures = [edgeForFiber.getFeature()]
      var startNode = edgeForFiber.getToNode()

      return this.walkThroughAncestorsFrom(startNode , successorEdgeFeatures);
    }

    walkThroughAncestorsFrom(node , features){
      var outEdges = node.getOutEdges();
      if(outEdges.length == 0){
        return features;
      }

      //check for somewhat malformed or infinite runs
      var totalEdges = this._graph.getNumEdges();
      if(this.ansCounter > totalEdges){
        console.log("Malformed Graph");
        console.log(this._graph);
        return [];
      }
      this.ansCounter ++;

      outEdges.map((outEdge) => {
        if((outEdge.getType() == "feeder" && state.showFeederFiber) || (outEdge.getType() == "distribution" && state.showDistributionFiber)) {
          features.push(outEdge.getFeature())
        }

        this.walkThroughAncestorsFrom(outEdge.getToNode() , features);
      });

      return features;
    }


    // Given an edgeId, find the decendant edges that are connected to it, and then returns the
    // features associated with those decendant edges. Used to find a list of all edges that
    getDecendantEdgeFeatures(edgeId) {
      this.desCounter = 0;
      var edgeForFiber = this._graph.edge(edgeId)

      if (!edgeForFiber) {
        return []
      }

      var successorEdgeFeatures = [edgeForFiber.getFeature()]
      var startNode = edgeForFiber.getFromNode()
      return this.walkThroughDecendentsFrom(startNode , successorEdgeFeatures);
    }

    walkThroughDecendentsFrom(node , features){
      var InEdges = node.getInEdges();
      if(InEdges.length == 0){
        return features;
      }
      //check for somewhat malformed or infinite runs
      var totalEdges = this._graph.getNumEdges();
      if(this.desCounter > totalEdges){
        console.log("Malformed Graph");
        console.log(this._graph);
        return [];
      }

      this.desCounter ++;
      InEdges.map((inEdge) => {
        if((inEdge.getType() == "feeder" && state.showFeederFiber) || (inEdge.getType() == "distribution" && state.showDistributionFiber)) {
          features.push(inEdge.getFeature())
        }
        this.walkThroughDecendentsFrom(inEdge.getFromNode() , features);
      })

      return features;
    }


    getBranchFromEdge(edgeId){
        var ans =  this.getAncestorEdgeFeatures(edgeId);
        var desc = this.getDecendantEdgeFeatures(edgeId);

       return ans.concat(desc);
    }

    getEdge( edgeId ){
      return this._graph.edge(edgeId)
    }
  }

  return new FiberGraph()
})
