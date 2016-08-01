package com.altvil.aro.service.graph;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.jgrapht.graph.DefaultWeightedEdge;

import com.altvil.aro.service.graph.node.GraphNode;

public class AroEdge<T> extends DefaultWeightedEdge {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private Long			  gid;
	private T				  value;

	public GraphNode getSourceNode() {
		return (GraphNode) super.getSource();
	}

	public GraphNode getTargetNode() {
		return (GraphNode) super.getTarget();
	}

	@Override
	public double getWeight() {
		// NOTE: As of August 2016 the edge's weight is set to the cost of edge in dollars
		
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
		return new ToStringBuilder(this).append("gid", gid).append("source", getSourceNode())
				.append("target", getTargetNode()).append("weight", getWeight()).append("target", getValue())
				.toString();
	}

}
