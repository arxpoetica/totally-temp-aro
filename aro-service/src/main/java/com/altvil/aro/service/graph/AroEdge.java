package com.altvil.aro.service.graph;

import org.jgrapht.graph.DefaultWeightedEdge;

import com.altvil.aro.service.graph.node.GraphNode;

public class AroEdge extends DefaultWeightedEdge {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	
	private Long gid ;
	
	
	public GraphNode getSourceNode() {
		return (GraphNode) super.getSource() ;
	}
	
	public GraphNode getTargetNode() {
		return (GraphNode) super.getTarget() ;
	}
	
	@Override
	public double getWeight() {
		return super.getWeight() ;
	}

	public Long getGid() {
		return gid;
	}

	public void setGid(Long gid) {
		this.gid = gid;
	}
	
	
	 @Override public String toString()
	    {
	        return "(" + getSource() + " : " + getTarget() + "):" + this.gid ;
	    }
	
	

}
