package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.AroException;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
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
		return false;
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
		return DefaultFiberCoverage.EMPTY_COVERAGE;
	}
	

	@Override
	public FiberProducer createFiberProducer(AnalysisContext ctx,
			FiberType fiberType, FiberConsumer fiberConsumer) {

		if (fiberConsumer.getFiberTypes().contains(fiberType)
				&& fiberConsumer.getFiberTypes().size() == 1) {
			ctx.getFiberProdcuerConsumerFactory().createProducer(fiberType, (int) Math.ceil(fiberConsumer.getCount(fiberType))) ;
		}

		throw new AroException("Unable to unify incoming Fiber " + fiberConsumer.getFiberTypes());

	}

	

}
