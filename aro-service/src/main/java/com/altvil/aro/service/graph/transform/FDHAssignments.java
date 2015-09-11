package com.altvil.aro.service.graph.transform;

import java.util.ArrayList;
import java.util.Collection;

import com.altvil.aro.service.graph.node.FDHNode;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;

public class FDHAssignments {

	private GraphNode vertex;
	private Collection<FDTNode> fdtNodes = new ArrayList<>();
	private FDHNode fdhNode;

	public FDHAssignments(GraphNode vertex, Collection<FDTNode> fdtNodes,
			FDHNode fdh) {
		super();
		this.vertex = vertex;
		this.fdtNodes = fdtNodes;

		this.fdhNode = fdh;

	}

	public GraphNode getVertex() {
		return vertex;
	}

	public FDHNode getFDHNode() {
		return fdhNode;
	}

	public Collection<FDTNode> getFdtNodes() {
		return fdtNodes;
	}

	public void setFdtNodes(Collection<FDTNode> fdtNodes) {
		this.fdtNodes = fdtNodes;
	}

}
