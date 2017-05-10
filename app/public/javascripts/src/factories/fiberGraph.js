/**
 * Holds a graph of the fiber routes displayed in the map (alongwith google maps feature objects)
 */
app.factory('fiberGraph', () => {

  // Class to represent a node in a graph
  class Node {
    constructor(nodeId) {
      this._nodeId = nodeId
      this._inEdges = []
      this._outEdges = []
    }

    // Adds an edge that points in to this node
    addInEdge(inEdge) {
      this._inEdges.push(inEdge)
    }

    // Adds an edge that points out of this node
    addOutEdge(outEdge) {
      this._outEdges.push(outEdge)
    }

    // Gets the edges that point out of this node
    getOutEdges() {
      return this._outEdges
    }
  }

  // Class to represent an edge in a graph
  class Edge {
    constructor(edgeId, fromNode, toNode, feature) {
      this._edgeId = edgeId
      this._fromNode = fromNode
      this._toNode = toNode
      this._feature = feature
    }

    // Returns the 'to' node for this edge
    getToNode() {
      return this._toNode
    }

    // Returns the google maps feature object associated with this edge
    getFeature() {
      return this._feature
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
    addEdge(edgeId, fromNodeId, toNodeId, feature) {
      this.addNode(fromNodeId)
      this.addNode(toNodeId)
      if (!this._edges[edgeId]) {
        this._edges[edgeId] = new Edge(edgeId, this._nodes[fromNodeId], this._nodes[toNodeId], feature)
        this._nodes[fromNodeId].addOutEdge(this._edges[edgeId])
        this._nodes[toNodeId].addInEdge(this._edges[edgeId])
      }
    }
  }

  // Start describing the service
  class FiberGraph {

    // Constructor
    constructor() {
      this.clear()
    }

    // Clear everything in the graph service
    clear() {
      this._graph = new Graph()
    }

    // Adds an edge to the fiber graph
    addEdge(edgeId, fromNodeId, toNodeId, feature) {
      this._graph.addEdge(edgeId, fromNodeId, toNodeId, feature)
    }

    // Given an edgeId, find the successor edges that are connected to it, and then returns the 
    // features associated with those successor edges. Used to find a list of all edges that 
    // connect a given edgeId to the central office.
    // Assumes that there is exactly one edge between any two nodes
    getSuccessorEdgeFeatures(edgeId) {
      var edgeForFiber = this._graph.edge(edgeId)
      if (!edgeForFiber) {
        return []
      }
      var successorEdgeFeatures = [edgeForFiber.getFeature()]
      var startNode = edgeForFiber.getToNode()
      var iLoop = 0, maxLoops = this._graph.getNumEdges()
      while (startNode && ++iLoop <= maxLoops) {  // Make sure we do not get into an infinite loop
        var outEdges = startNode.getOutEdges()
        if (outEdges.length > 1) {
          console.log('Multiple outEdges for node')
          break
        }
        if (outEdges.length === 0) {
          break // We are done here...
        }
        var outgoingEdge = outEdges[0]
        successorEdgeFeatures.push(outgoingEdge.getFeature())
        startNode = outgoingEdge.getToNode()
      }
      return successorEdgeFeatures
    }
  }

  return new FiberGraph()
})
