package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.FDHNode;
import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.vividsolutions.jts.geom.Point;

public class FDHNodeImpl extends RoadNodeImpl implements FDHNode {
	
	public FDHNodeImpl(Long id, Point point) {
		super(id, point);
	}

	@Override
	public void accept(GraphNodeVisitor visitor) {
		visitor.visit(this) ;
	}
	
}
