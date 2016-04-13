package com.altvil.aro.service.optimize.spi.impl;

import java.util.HashMap;
import java.util.Map;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.optimize.spi.ParentResolver;
import com.altvil.aro.service.plan.NetworkModel;

public class ParentResolverImpl implements ParentResolver {

	private Map<GraphEdgeAssignment, GraphEdgeAssignment> parentMap = new HashMap<>() ;
	
	public ParentResolverImpl(NetworkModel model) {
		index(model) ;
	}
	
	private void index(NetworkModel model) {
		FiberSourceMapping fsm = model.getFiberSourceMapping() ;
		index(fsm) ;
	}
	
	private void index(GraphMapping gm) {
		for(GraphMapping cm : gm.getChildren()) {
			parentMap.put(cm.getGraphAssignment(), gm.getGraphAssignment()) ;
			index(cm) ;
		}
	}

	@Override
	public GraphEdgeAssignment getParentAssignment(
			GraphEdgeAssignment assignment) {
		return parentMap.get(assignment);
	}
	
	

}
