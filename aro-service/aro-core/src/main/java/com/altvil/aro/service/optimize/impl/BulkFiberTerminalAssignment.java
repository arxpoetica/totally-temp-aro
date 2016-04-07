package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

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
	public double getCost(AnalysisContext ctx, int fiberRequiredStrands) {
		
		ctx.getPricingModel().getMaterialCost(MaterialType.BFT) ;
		return ctx.getPricingModel().getMaterialCost(MaterialType.BFT) ;
	}

	public BulkFiberTerminal getBftEquipment() {
		return bftEquipment;
	}
	

	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		//return serializer.serialize(node, this) ;
		return null ;
	}

	@Override
	public DemandCoverage getDirectCoverage(AnalysisContext ctx) {
		
		DefaultFiberCoverage.Accumulator accumulator = DefaultFiberCoverage.accumulate() ;
		accumulator.add(bftEquipment.getLocationEntity(), bftEquipment.getLocationDemand()) ;
		return accumulator.getResult() ;
		
	}
}