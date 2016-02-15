package com.altvil.aro.service.graph.assigment.impl;

import java.util.Collection;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.utils.StreamUtil;

public class LeafGraphMapping implements GraphMapping {
	private GraphEdgeAssignment graphAssignment;
	private Collection<GraphEdgeAssignment> childAssignments;

	public LeafGraphMapping(GraphEdgeAssignment graphAssignment,
			Collection<GraphEdgeAssignment> childAssignments) {
		super();
		this.graphAssignment = graphAssignment;
		this.childAssignments = childAssignments;
	}

	@Override
	public GraphEdgeAssignment getGraphAssignment() {
		return graphAssignment;
	}

	@Override
	public Collection<GraphMapping> getChildren() {
		return StreamUtil
				.map(childAssignments, a -> new DefaultGraphMapping(a));
	}

	@Override
	public Collection<GraphEdgeAssignment> getChildAssignments() {
		return childAssignments;
	}

	@Override
	public AroEntity getAroEntity() {
		return graphAssignment.getAroEntity();
	}

}
