package com.altvil.aro.service.optimize.impl;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.PricingContext;

public class CentralOfficeAssignment extends AbstractEquipmentAssignment {

	private CentralOfficeEquipment equipment;

	public CentralOfficeAssignment(GraphEdgeAssignment graphAssignment,
			CentralOfficeEquipment equipment) {
		super(graphAssignment);
		this.equipment = equipment;
	}

	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		// BIG TODO Add equipment to the CentralOffice as a function of Network
		// demand
		return ctx.getPricingModel().getMaterialCost(MaterialType.CO, coverage.getDemand());
	}

	public CentralOfficeEquipment getCentralOfficeEquipment() {
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

	public String toString() {
		return new ToStringBuilder(this).append("equipment", equipment).toString();
	}
}
