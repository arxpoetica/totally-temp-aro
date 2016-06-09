package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.JunctionNode;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.PricingContext;

public class SplitterNodeAssignment extends AbstractEquipmentAssignment {

	private JunctionNode junctionNode ;
	
	public SplitterNodeAssignment(GraphEdgeAssignment assignment, JunctionNode junctionNode) {
		super(assignment);
		this.junctionNode = junctionNode ;
	}
	
	@Override
	public boolean isJunctionNode() {
		return true;
	}
	
	
	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		return 0;
	}


	public JunctionNode getJunctionNode() {
		return junctionNode;
	}


	@Override
	public void serialize(GeneratingNode node, ModelSerializer serializer) {
		 serializer.serialize(node, this) ;
	}



	public JunctionNode getSplicePoint() {
		return junctionNode ;
	}
	
	

}
