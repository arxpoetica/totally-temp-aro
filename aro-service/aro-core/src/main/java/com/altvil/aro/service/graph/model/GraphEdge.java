package com.altvil.aro.service.graph.model;



public interface GraphEdge {
	
	public Long getSource();

	public Long getTarget();

	public Long getGID();

	public EdgeType getEdgeType();

	public double getEdgeLength();

}
