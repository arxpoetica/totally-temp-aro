package com.altvil.aro.service.graph.transform.impl;

import com.altvil.aro.service.graph.node.FDHNode;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.altvil.aro.service.graph.node.LocationNode;
import com.altvil.aro.service.graph.node.RoadNode;
import com.altvil.aro.service.graph.node.SpliceNode;
import com.altvil.aro.util.function.Aggregator;

public class DefaultNetworkVisitor<U extends DefaultNetworkVisitor<U>> implements
		Aggregator<GraphNode>,
		GraphNodeVisitor {

	@Override
	public DefaultNetworkVisitor<U> apply(GraphNode t) {
		t.accept(this);
		return this;
	}

	@Override
	public void visit(LocationNode node) {
	}

	@Override
	public void visit(SpliceNode node) {
	}
	

	@Override
	public void visit(RoadNode node) {
	}

	@Override
	public void visit(FDTNode node) {
	}

	@Override
	public void visit(FDHNode node) {
	}

}
