package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.RemoteTerminal;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public class RemoteTerminalAssignment  extends AbstractEquipmentAssignment {

	private RemoteTerminal equipment;

	public RemoteTerminalAssignment(GraphEdgeAssignment graphAssignment,
			RemoteTerminal equipment) {
		super(graphAssignment);
		this.equipment = equipment;
	}

	@Override
	public double getCost(AnalysisContext ctx, int requiredFiberStrands) {
		return 0;
	}

	public RemoteTerminal getCentralOfficeEquipment() {
		return equipment;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		//return serializer.serialize(node, this);
		return null ;
	}

	
	@Override
	public boolean isSourceEquipment() {
		return true;
	}
	

}
