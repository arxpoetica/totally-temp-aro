package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.vividsolutions.jts.geom.Point;

public abstract class AbstractNode implements GraphNode {

	private Long id;
	private Point point;

	private GraphNode locationNode;

	public AbstractNode(Long id, Point point) {
		super();
		this.id = id;
		this.point = point;
	}

	@Override
	public Long getId() {
		return id;
	}

	@Override
	public Point getPoint() {
		return point;
	}

	@Override
	public String toString() {
		return this.getClass().getSimpleName() + ":" + getId();
	}

	@Override
	public void addLocation(GraphNode node) {
		locationNode = node;

	}

	@Override
	public void accept(GraphNodeVisitor visitor) {
		// TODO Auto-generated method stub

	}

	@Override
	public boolean isConnectedToLocationNode() {
		return locationNode != null;
	}

	@Override
	public GraphNode getLocationNode() {
		return locationNode;
	}

	@Override
	public boolean isLocationNode() {
		return false ;
	}
	
	
	

}
