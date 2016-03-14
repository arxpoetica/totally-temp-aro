package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public class RootAssignment extends AbstractEquipmentAssignment {

	public RootAssignment(GraphEdgeAssignment graphAssignment) {
		super(graphAssignment);
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		return serializer.serialize(node, this) ;
		
	}

	@Override
	public double getCost(AnalysisContext ctx, int fiberRequiredStrandse) {
		return 0;
	}
	
	@Override
	public boolean isRoot() {
		return true ;
	}

}
