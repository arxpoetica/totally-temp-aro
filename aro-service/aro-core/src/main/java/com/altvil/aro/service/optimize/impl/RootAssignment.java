package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.PricingContext;

public class RootAssignment extends AbstractEquipmentAssignment {

	public RootAssignment(GraphEdgeAssignment graphAssignment) {
		super(graphAssignment);
	}

	@Override
	public void serialize(GeneratingNode node, ModelSerializer serializer) {
		 serializer.serialize(node, this) ;
	}
	
	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public boolean isRoot() {
		return true ;
	}

}
