package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public class NoEquipment extends AbstractEquipmentAssignment {

	public static final EquipmentAssignment ASSIGNMENT = new NoEquipment();

	public NoEquipment() {
		super(null);
	}

	@Override
	public double getCost(AnalysisContext ctx, int fiberRequiredStrands) {
		return 0;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node,
			ModelSerializer serializer) {
		//This should cause a generic reset
		
		return null ;
	}

}
