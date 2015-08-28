package com.altvil.aro.service.graph;

import org.jgrapht.graph.DefaultWeightedEdge;

import com.altvil.aro.service.graph.node.GraphNode;

public class AroEdge extends DefaultWeightedEdge {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	public GraphNode getSourceNode() {
		return (GraphNode) super.getSource() ;
	}
	
	public GraphNode getTargetNode() {
		return (GraphNode) super.getTarget() ;
	}


}
