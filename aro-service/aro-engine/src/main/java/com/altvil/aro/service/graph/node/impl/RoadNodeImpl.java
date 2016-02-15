package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.altvil.aro.service.graph.node.RoadNode;
import com.vividsolutions.jts.geom.Point;

public class RoadNodeImpl extends AbstractNode implements RoadNode {

	
	public RoadNodeImpl(Long id, Point point) {
		super(id, point);
	}

	@Override
	public void accept(GraphNodeVisitor visitor) {
		visitor.visit(this);
	}

	
	
	@Override
	public String toString() {
		return this.getClass().getSimpleName() + ":" + getId()  + " " + super.isConnectedToLocationNode();
	}
	
	
}