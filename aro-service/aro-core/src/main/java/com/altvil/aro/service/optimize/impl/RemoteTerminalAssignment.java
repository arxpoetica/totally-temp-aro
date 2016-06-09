package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.RemoteTerminal;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.PricingContext;

public class RemoteTerminalAssignment  extends AbstractEquipmentAssignment {

	private RemoteTerminal equipment;

	public RemoteTerminalAssignment(GraphEdgeAssignment graphAssignment,
			RemoteTerminal equipment) {
		super(graphAssignment);
		this.equipment = equipment;
	}
	

	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		// TODO Auto-generated method stub
		return 0;
	}



	public RemoteTerminal getCentralOfficeEquipment() {
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
