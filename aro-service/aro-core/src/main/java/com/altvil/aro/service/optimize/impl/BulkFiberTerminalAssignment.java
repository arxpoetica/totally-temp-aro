package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.aro.service.optimize.spi.PricingContext;

public class BulkFiberTerminalAssignment extends AbstractEquipmentAssignment {

	private BulkFiberTerminal bftEquipment;
	
	public BulkFiberTerminalAssignment(GraphEdgeAssignment ga, BulkFiberTerminal bftEquipment) {
		super(ga);
		this.bftEquipment = bftEquipment;
	
	}

	public BulkFiberTerminalAssignment(GraphMapping m) {
		this(m.getGraphAssignment(), (BulkFiberTerminal) m.getAroEntity());
	}
	
	

	@Override
	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {
		ctx.getPricingModel().getMaterialCost(MaterialType.BFT) ;
		return ctx.getPricingModel().getMaterialCost(MaterialType.BFT) ;

	}

	
	public BulkFiberTerminal getBftEquipment() {
		return bftEquipment;
	}
	

	@Override
	public void serialize(GeneratingNode node, ModelSerializer serializer) {
		serializer.serialize(node, this);
	}
	


	@Override
	public DemandCoverage getDirectCoverage(AnalysisContext ctx) {
		
		DefaultFiberCoverage.Accumulator accumulator = DefaultFiberCoverage.accumulate() ;
		accumulator.add(bftEquipment.getAssignedEntityDemand()) ;
		return accumulator.getResult() ;
		
	}
}