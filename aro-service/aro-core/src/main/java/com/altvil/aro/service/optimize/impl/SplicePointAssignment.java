package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.SplicePoint;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.PricingContext;

public class SplicePointAssignment   extends AbstractEquipmentAssignment {

	private SplicePoint equipment;

	public SplicePointAssignment(GraphEdgeAssignment graphAssignment,
			SplicePoint equipment) {
		super(graphAssignment);
		this.equipment = equipment;
	}
	

	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		return 0;
	}



	public SplicePoint getCentralOfficeEquipment() {
		return equipment;
	}

	@Override
	public void serialize(GeneratingNode node, ModelSerializer serializer) {
		serializer.serialize(node, this);
	}
	
	@Override
	public boolean isSourceEquipment() {
		return true;
	}

	

}
