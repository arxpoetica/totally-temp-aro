package com.altvil.aro.service.plan.impl;

import java.util.Set;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.EdgeUtils;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.GeneratedFiberRoute;

public class DefaultGeneratedFiberRoute implements GeneratedFiberRoute {

	// Assumes edges are Directed

	private GraphNode sourceVertex;
	private Set<AroEdge<GeoSegment>> edges;

	public DefaultGeneratedFiberRoute(GraphNode sourceVertex,
			Set<AroEdge<GeoSegment>> edges) {
		super();
		this.sourceVertex = sourceVertex;
		this.edges = edges;
	}

	@Override
	public boolean isEmpty() {
		return edges.isEmpty();
	}

	@Override
	public Set<AroEdge<GeoSegment>> getEdges() {
		return edges;
	}

	@Override
	public GraphNode getSourceVertex() {
		return sourceVertex ;
	}

	@Override
	public DAGModel<GeoSegment> createDagModel(GraphModelBuilder<GeoSegment> b) {

		if (edges.isEmpty()) {
			b.addVertex(sourceVertex);
		} else {
			edges.forEach(e -> b.add(e.getSourceNode(), e.getTargetNode(),
					e.getValue(), e.getWeight()));

		}

		return b.buildDAG();
	}

	protected GraphModelBuilder<GeoSegment> assembleDag(
			GraphModelBuilder<GeoSegment> b) {
		edges.forEach(e -> b.add(e.getSourceNode(), e.getTargetNode(),
				e.getValue(), e.getWeight()));
		return b;
	}

}
