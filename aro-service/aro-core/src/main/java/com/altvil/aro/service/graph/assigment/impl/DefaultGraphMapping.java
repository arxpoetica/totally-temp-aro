package com.altvil.aro.service.graph.assigment.impl;

import java.util.Collection;
import java.util.Collections;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.utils.StreamUtil;

public class DefaultGraphMapping implements GraphMapping {

	private GraphEdgeAssignment graphAssignment;
	private Collection<GraphMapping> graphMapping;
	
	

	public DefaultGraphMapping(GraphEdgeAssignment graphAssignment,
			Collection<GraphMapping> graphMapping) {
		super();
		this.graphAssignment = graphAssignment;
		this.graphMapping = graphMapping;
	}
	
	
	public DefaultGraphMapping(GraphEdgeAssignment graphAssignment) {
		this(graphAssignment, StreamUtil
				.asList((GraphMapping) new DefaultGraphMapping(graphAssignment,
						Collections.emptyList())));
	}

	@Override
	public GraphEdgeAssignment getGraphAssignment() {
		return graphAssignment;
	}

	@Override
	public Collection<GraphMapping> getChildren() {
		return graphMapping;
	}

	@Override
	public Collection<GraphEdgeAssignment> getChildAssignments() {
		return StreamUtil.map(graphMapping, m -> m.getGraphAssignment());
	}

	@Override
	public AroEntity getAroEntity() {
		return graphAssignment.getAroEntity();
	}

}
