package com.altvil.aro.service.graph;

import org.jgrapht.graph.DefaultWeightedEdge;

import com.altvil.aro.service.graph.node.GraphNode;

public class AroEdge<T> extends DefaultWeightedEdge {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private Long gid;
	private T value ;

	public GraphNode getSourceNode() {
		return (GraphNode) super.getSource();
	}

	public GraphNode getTargetNode() {
		return (GraphNode) super.getTarget();
	}
	
	@Override
	public double getWeight() {
		return super.getWeight();
	}
	
	
	public T getValue() {
		return value;
	}

	public void setValue(T value) {
		this.value = value;
	}

	public Long getGid() {
		return gid;
	}

	public void setGid(Long gid) {
		this.gid = gid;
	}

	@Override
	public String toString() {
		return "(" + getSource() + " : " + getTarget() + "):" + this.getWeight() + " ... " + value.toString() ;
	}

}
