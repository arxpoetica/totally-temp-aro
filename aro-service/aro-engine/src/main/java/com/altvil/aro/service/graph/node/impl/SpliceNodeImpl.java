package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.altvil.aro.service.graph.node.SpliceNode;
import com.vividsolutions.jts.geom.Point;

public class SpliceNodeImpl extends AbstractNode implements SpliceNode {

	public SpliceNodeImpl(Long id, Point point) {
		super(id, point);
	}

	@Override
	public void accept(GraphNodeVisitor visitor) {
		visitor.visit(this) ;
	}	
	
}
