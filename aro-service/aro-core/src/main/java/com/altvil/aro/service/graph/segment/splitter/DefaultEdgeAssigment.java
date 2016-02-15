package com.altvil.aro.service.graph.segment.splitter;

import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class DefaultEdgeAssigment implements EdgeAssignment {

	private GraphNode src;
	private GraphNode target;
	private GeoSegment segment;
	private double weight;

	public DefaultEdgeAssigment(GraphNode src, GraphNode target,
			GeoSegment segment, double weight) {
		super();
		this.src = src;
		this.target = target;
		this.segment = segment;
		this.weight = weight;
		
		
		if( this.weight < 0 ) throw new IllegalArgumentException("Negative weight " + weight) ;
		
	}

	@Override
	public GraphNode getSource() {
		return src;
	}

	@Override
	public GraphNode getTarget() {
		return target;
	}

	@Override
	public GeoSegment getGeoSegment() {
		return segment;
	}

	@Override
	public double getWeight() {
		return weight ;
	}

}
