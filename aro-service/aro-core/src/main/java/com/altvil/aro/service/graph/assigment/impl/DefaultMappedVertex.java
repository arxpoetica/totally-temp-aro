package com.altvil.aro.service.graph.assigment.impl;

import com.altvil.aro.service.graph.assigment.MappedVertex;
import com.altvil.aro.service.graph.assigment.VertexAssignment;
import com.altvil.aro.service.graph.node.GraphNode;

public class DefaultMappedVertex implements MappedVertex {

	private GraphNode graphNode;
	private VertexAssignment vertexAssignment;

	public DefaultMappedVertex(GraphNode graphNode,
			VertexAssignment vertexAssignment) {
		super();
		this.graphNode = graphNode;
		this.vertexAssignment = vertexAssignment;
	}

	@Override
	public GraphNode getGraphNode() {
		return graphNode;
	}

	@Override
	public VertexAssignment getVertexAssignment() {
		return vertexAssignment;
	}

}
