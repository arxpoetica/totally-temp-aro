package com.altvil.aro.service.graph.transform.impl;

import java.util.Collection;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;

import org.jgrapht.Graph;
import org.jgrapht.GraphPath;
import org.jgrapht.Graphs;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.alg.TargetRoute;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

//TODO move to TransformFactory
public class RouteDagAssembler {

	private Graph<GraphNode, AroEdge<GeoSegment>> sourceGraph;
	private GraphModelBuilder<GeoSegment> graphBuilder;

	private Collection<AroEdge<GeoSegment>> seenEdges = new HashSet<>();

	public RouteDagAssembler(GraphModelBuilder<GeoSegment> graphBuilder,
			Graph<GraphNode, AroEdge<GeoSegment>> sourceGraph) {
		super();
		this.graphBuilder = graphBuilder;
	}

	public DAGModel<GeoSegment> createDagModel(
			SourceRoute<GraphNode, AroEdge<GeoSegment>> sourceRoot) {
		sourceRoot.getSubRoutes().getTargetRoutes().forEach(this::updatePath);
		return graphBuilder.buildDAG();
	}

	public RouteDagAssembler updatePath(
			TargetRoute<GraphNode, AroEdge<GeoSegment>> target) {

		GraphPath<GraphNode, AroEdge<GeoSegment>> path = target.getPath();
		Iterator<GraphNode> verticies = Graphs.getPathVertexList(path)
				.iterator();
		List<AroEdge<GeoSegment>> edgeList = path.getEdgeList();

		GraphNode start = verticies.next();

		for (AroEdge<GeoSegment> e : edgeList) {
			GraphNode end = verticies.next();
			if (seenEdges.add(e)) {
				addEdge(e, start, end);
			}
			start = end;
		}

		return this;
	}

	private void addEdge(AroEdge<GeoSegment> edge, GraphNode selectedSource,
			GraphNode selectedTarget) {
		GraphNode targetVertex = sourceGraph.getEdgeTarget(edge);
		GeoSegment gs = edge.getValue();

		if (!selectedTarget.equals(targetVertex)) {
			gs = (GeoSegment) gs.reverse();
		}

		graphBuilder.add((GraphNode) selectedSource,
				(GraphNode) selectedTarget, gs, gs.getLength());

	}

	public DAGModel<GeoSegment> assemble() {
		return graphBuilder.buildDAG();
	}

}
