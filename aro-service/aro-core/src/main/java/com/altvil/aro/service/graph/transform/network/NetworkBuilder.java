package com.altvil.aro.service.graph.transform.network;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.VertexAssignment;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.splitter.EdgeAssignment;
import com.altvil.aro.service.graph.segment.splitter.GeoSegmentSplitter;
import com.altvil.aro.service.graph.segment.splitter.SplitAssignments;

public class NetworkBuilder {

	private GraphModelBuilder<GeoSegment> graphBuilder;

	private Map<GeoSegment, List<GraphEdgeAssignment>> assignmentsByGeoSegment = new HashMap<>();
	private GeoSegmentSplitter splitter;

	private Map<GraphAssignment, GraphNode> resolvedAssignments = new HashMap<>();

	
	public NetworkBuilder(GraphModelBuilder<GeoSegment> graphBuilder,
			GraphNodeFactory graphNodeFactory) {
		super();
		splitter = new GeoSegmentSplitter(graphNodeFactory);
		this.graphBuilder = graphBuilder;
	}

	public Map<GraphAssignment, GraphNode> getResolvedAssignments() {
		return resolvedAssignments;
	}

	public void add(GraphAssignment va) {
		if (va instanceof GraphEdgeAssignment) {

			GraphEdgeAssignment edgeAssignment = (GraphEdgeAssignment) va;

			List<GraphEdgeAssignment> assigments = assignmentsByGeoSegment
					.get(edgeAssignment.getGeoSegment());
			if (assigments == null) {
				assignmentsByGeoSegment.put(edgeAssignment.getGeoSegment(),
						assigments = new ArrayList<>());
			}
			assigments.add((GraphEdgeAssignment) va);
			resolvedAssignments.put(va, null);
		} else {

			VertexAssignment vertexAssignment = (VertexAssignment) va;
			GraphNode gn = vertexAssignment.getOriginalVertex();
			resolvedAssignments.put(va, gn);
		}
	}

	public void add(Collection<? extends GraphAssignment> vertexAssignments) {

		for (GraphAssignment va : vertexAssignments) {
			add(va);
		}
	}

	private GraphNode toNewVertex(GraphNode node) {
		return node;
	}

	private void add(AroEdge<GeoSegment> edge) {
		
		
		List<GraphEdgeAssignment> vertexAssignments = 
				( edge.getValue() == null )  ? null : assignmentsByGeoSegment
				.remove(edge.getValue());

		GraphNode source = toNewVertex(edge.getSourceNode());
		GraphNode target = toNewVertex(edge.getTargetNode());

		if (vertexAssignments == null) {
			graphBuilder.add(source, target, edge.getValue(), edge.getWeight());
		} else {

			SplitAssignments splitAssignments = splitter.split(source, target,
					edge.getValue(), vertexAssignments);

			if (splitAssignments.getMappedVerticies().size() != vertexAssignments
					.size()) {
				throw new RuntimeException("Failed to node graph");
			}

			resolvedAssignments.putAll(splitAssignments.getMappedVerticies());

			for (EdgeAssignment e : splitAssignments.getEdgeAssignments()) {
				graphBuilder.add(e.getSource(), e.getTarget(),
						e.getGeoSegment(), e.getWeight());
			}
		}
	}

	public NetworkBuilder renodeGraph(GraphModel<GeoSegment> model) {

		for (AroEdge<GeoSegment> edge : model.getEdges()) {
			add(edge);
		}

		return this;
	}

	public GraphModelBuilder<GeoSegment> getBuilder() {
		return graphBuilder;
	}

}
