package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public class CompositeGeneratingNode extends DefaultGeneratingNode {

	
	
	
	public CompositeGeneratingNode(AnalysisContext ctx,
			EquipmentAssignment equipmentAssigment, FiberAssignment fiberAssignment,  DefaultGeneratingNode parent) {
		super(ctx, equipmentAssigment, fiberAssignment, parent);
	}

	@Override
	protected void _addChild(GeneratingNode child) {
		super._addChild(child);
		
	}
	

}
