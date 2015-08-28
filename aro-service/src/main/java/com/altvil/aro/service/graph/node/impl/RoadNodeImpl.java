package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.altvil.aro.service.graph.node.RoadNode;
import com.vividsolutions.jts.geom.Point;

public class RoadNodeImpl extends AbstractNode implements RoadNode {

	private Long gid;
	
	public RoadNodeImpl(Long id, Point point, Long gid) {
		super(id, point);
		this.gid = gid;
	}

	@Override
	public void accept(GraphNodeVisitor visitor) {
		visitor.visit(this);
	}

	@Override
	public Long getGid() {
		return gid;
	}
	
	@Override
	public String toString() {
		return this.getClass().getSimpleName() + ":" + getId()  + ":" + getGid() + " " + super.isConnectedToLocationNode();
	}
	
	
}