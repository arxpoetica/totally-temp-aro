package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.PricingContext;

public class NoEquipment extends AbstractEquipmentAssignment {

	public static final EquipmentAssignment ASSIGNMENT = new NoEquipment();

	public NoEquipment() {
		super(null);
	}

	

	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		return 0 ;
	}



	@Override
	public void serialize(GeneratingNode node,
			ModelSerializer serializer) {
		//serializer.serialize(node,this) ;
	}

}
