package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
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
	public double getCost(AnalysisContext ctx, int requiredFiberStrands) {

		int roundedUpSplitters = ctx.getHubModel().computeNumberOfSplitters(requiredFiberStrands) ;
		
		return ctx.getPricingModel().getMaterialCost(
				MaterialType.FDH)
				+ (ctx.getPricingModel().getMaterialCost(
				ctx.getHubModel().getMaterialType()) * roundedUpSplitters);

	}

	public FDHEquipment getFdhEquipment() {
		return fdhEquipment;
	}

	@Override
	public boolean rebuildNetwork(GeneratingNode node, AnalysisContext ctx) {
		return true;
	}
	
	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		return serializer.serialize(node, this);
	}

	@Override
	public int getRequiredIncomingFiberStrands(AnalysisContext ctx, int requiredOutgoingFiberStrands) {
		int splitterRatio = ctx.getHubModel().getSplitterRatio();
		int roundedUpSplitters = (int) Math.ceil(((double) requiredOutgoingFiberStrands) / splitterRatio);
		return roundedUpSplitters;
	}
}
