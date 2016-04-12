package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.FiberConsumer;
import com.altvil.aro.service.optimize.model.FiberProducer;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;

public class FdhAssignment extends AbstractEquipmentAssignment {

	private FDHEquipment fdhEquipment;

	public FdhAssignment(GraphEdgeAssignment graphAssignment,
			FDHEquipment fdhEquipment) {
		super(graphAssignment);
		this.fdhEquipment = fdhEquipment;
	}

	@Override
	public double getCost(AnalysisContext ctx, FiberConsumer fiberConsumer,
			FiberProducer fiberProducer, DemandCoverage coverage) {

		int roundedUpSplitters = calculateSplitterCount(ctx, fiberConsumer) ;

		return ctx.getPricingModel().getMaterialCost(MaterialType.FDH)
				+ (ctx.getPricingModel().getMaterialCost(
						ctx.getHubModel().getMaterialType()) * roundedUpSplitters);

	}
	
	
	@Override
	public FiberProducer createFiberProducer(AnalysisContext ctx,
			FiberType fiberType, FiberConsumer fiberConsumer) {
		int splitterCount = calculateSplitterCount(ctx, fiberConsumer) ;
		int feederCount =  (int) Math.ceil(fiberConsumer.getCount(FiberType.FEEDER)) ;
		return ctx.getFiberProducerConsumerFactory().createProducer(fiberType, splitterCount + feederCount);
	}

	public FDHEquipment getFdhEquipment() {
		return fdhEquipment;
	}

	@Override
	public boolean rebuildNetwork(GeneratingNode node, AnalysisContext ctx) {
		return true;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node,
			ModelSerializer serializer) {
		return serializer.serialize(node, this);
	}

	
	private int calculateSplitterCount(AnalysisContext ctx, FiberConsumer fiberConsumer) {
		double distributionDemand = fiberConsumer
				.getCount(FiberType.DISTRIBUTION);
		int roundedUpSplitters = (int) Math.ceil(((double) distributionDemand)
				/ ctx.getHubModel().getSplitterRatio());
		return roundedUpSplitters;
	}
	

}
