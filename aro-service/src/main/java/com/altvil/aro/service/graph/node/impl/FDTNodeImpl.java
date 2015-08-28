package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.vividsolutions.jts.geom.Point;

public class FDTNodeImpl extends RoadNodeImpl implements FDTNode {
	
	public FDTNodeImpl(Long id, Point point, Long gid) {
		super(id, point, gid);
	}

	@Override
	public void accept(GraphNodeVisitor visitor) {
		visitor.visit(this) ;
	}
	
}
