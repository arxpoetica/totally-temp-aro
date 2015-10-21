package com.altvil.aro.service.graph.transform.fdtx;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.jgrapht.DirectedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.RoadNode;


public class LocationsStream {
	
	
	private static final Logger log = LoggerFactory
			.getLogger(LocationsStream.class.getName());

	private DirectedGraph<GraphNode, AroEdge<Long>> graph;

	private int nodeCount;
	private double totalLength;

	private RoadNode startNode;
	private GraphNode endNode;

	private RoadNode previousNode;
	private Long currentGid;

	private List<LocationIntersection> nodes = new ArrayList<>(100);

	public LocationsStream(DirectedGraph<GraphNode, AroEdge<Long>> graph) {
		this.graph = graph;
	}

	public Long getGid() {
		return currentGid;
	}

	public void init(RoadNode node) {

		totalLength = 0.0;
		startNode = node;
		previousNode = node;
		endNode = null;
		this.currentGid = null;
		nodeCount = 1;
		nodes.clear();
		if (node.isConnectedToLocationNode()) {
			nodes.add(new LocationIntersection(totalLength, node));
		}
	}

	public void link(AroEdge<Long> edge) {

		if (edge.getGid() == null) {
			this.currentGid = edge.getGid();
		} else if (edge.getGid().equals(getGid())) {
			this.endNode = edge.getTargetNode();
			nodeCount++;
			totalLength += edge.getWeight();
		}

	}

	public Collection<AroEdge<Long>> close() {
		this.endNode = previousNode;
		return graph.outgoingEdgesOf(this.endNode);
	}

	public boolean groupBy(RoadNode node) {

		AroEdge<Long> e = graph.getEdge(previousNode, node);
		
		// Basis
		if (e == null) {
			if (graph.inDegreeOf(node) != 0 && log.isErrorEnabled())
				log.error("Failed to traverse " + e);
			return false;
		}
		

		// if non Location node detected (Stop Condition)
		if (graph.inDegreeOf(node) > 1) {
			return false;
		}

		// Mark next Node
		if (currentGid == null) {
			currentGid = e.getGid();
		} else {
			// Stop Condition
			if (!e.getGid().equals(currentGid)) {
				return false;
			}
		}

		// Induction

		totalLength += e.getWeight();
		nodeCount++;

		this.previousNode = node;
		if (node.isConnectedToLocationNode()) {
			this.nodes.add(new LocationIntersection(totalLength, node));
		}

		return true;
	}

	public List<LocationIntersection> getLocations() {
		return nodes;
	}
	
	public int getLocationCount() {
		return nodes.size() ;
	}

	public double getTotalLength() {
		return totalLength;
	}

	public RoadNode getStartNode() {
		return startNode;
	}

	public GraphNode getEndNode() {
		return endNode;
	}

	public int getTotalNodeCount() {
		return nodeCount;
	}
}