package com.altvil.aro.service.graph.segment.impl;

import com.altvil.aro.service.graph.model.AroEdgeDefinition;
import com.altvil.aro.service.graph.node.GraphNode;

public class DefaultAroDefinition<T> implements AroEdgeDefinition<T> {

	private GraphNode source ;
	private GraphNode target ;
	private double weight ;
	private T value ;
	
	public DefaultAroDefinition(GraphNode source, GraphNode target,
			double weight, T value) {
		super();
		this.source = source;
		this.target = target;
		this.weight = weight;
		this.value = value;
	}

	@Override
	public GraphNode getSource() {
		return source ;
	}

	@Override
	public GraphNode getTarget() {
		return target ;
	}

	@Override
	public double getWeight() {
		return weight ;
	}

	@Override
	public T getValue() {
		return value ;
	}

	
	
}
