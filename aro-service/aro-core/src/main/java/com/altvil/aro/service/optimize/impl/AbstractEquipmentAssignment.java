package com.altvil.aro.service.optimize.impl;

import java.util.Collections;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public abstract class AbstractEquipmentAssignment implements
		EquipmentAssignment {

	private GraphEdgeAssignment graphAssignment;

	public AbstractEquipmentAssignment(GraphEdgeAssignment graphAssignment) {
		super();
		this.graphAssignment = graphAssignment;
	}
	
	

	@Override
	public boolean isRoot() {
		return false ;
	}



	@Override
	public GraphEdgeAssignment getGraphAssignment() {
		return graphAssignment;
	}
	

	@Override
	public boolean isSourceEquipment() {
		return false;
	}

	@Override
	public boolean rebuildNetwork(GeneratingNode node, AnalysisContext ctx) {
		return false;
	}


	@Override
	public DemandCoverage getDirectCoverage(AnalysisContext ctx) {
		return DefaultFiberCoverage.create(Collections.emptySet(), ctx.getCoverageScoreSupplier());
	}

	@Override
	public int getRequiredIncomingFiberStrands(AnalysisContext ctx, int requiredOutgoingFiberStrands) {
		return requiredOutgoingFiberStrands;
	}
}
