package com.altvil.aro.service.graph.assigment.impl;

import java.util.Collection;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;

public class FiberSourceMapping extends DefaultGraphMapping {

	public FiberSourceMapping(GraphEdgeAssignment graphAssignment,
			Collection<GraphMapping> graphMapping) {
		super(graphAssignment, graphMapping);
	}

	public FiberSourceMapping(GraphEdgeAssignment graphAssignment) {
		super(graphAssignment);
	}

}
