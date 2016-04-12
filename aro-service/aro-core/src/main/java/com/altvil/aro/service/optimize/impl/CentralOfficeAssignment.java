package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public class CentralOfficeAssignment extends AbstractEquipmentAssignment {

	private CentralOfficeEquipment equipment;

	public CentralOfficeAssignment(GraphEdgeAssignment graphAssignment,
			CentralOfficeEquipment equipment) {
		super(graphAssignment);
		this.equipment = equipment;
	}

	@Override
	public double getCost(AnalysisContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		// BIG TODO Add equipment to the CentralOffice as a function of Network
		// demand
		return 0;
	}

	public CentralOfficeEquipment getCentralOfficeEquipment() {
		return equipment;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		return serializer.serialize(node, this);
	}
	
	@Override
	public boolean isSourceEquipment() {
		return true;
	}

	

}
