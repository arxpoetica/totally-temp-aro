package com.altvil.aro.service.optimize.impl;

import java.util.Collection;

import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.utils.StreamUtil;

public class FdtAssignment extends AbstractEquipmentAssignment {

	private FDTEquipment fdtEquipment;
	private Collection<GraphEdgeAssignment> locations;

	public FdtAssignment(GraphEdgeAssignment ga, FDTEquipment fdtEquipment,
			Collection<GraphEdgeAssignment> locations) {
		super(ga);
		this.fdtEquipment = fdtEquipment;
		this.locations = locations;

	}

	public FdtAssignment(GraphMapping m) {
		this(m.getGraphAssignment(), (FDTEquipment) m.getAroEntity(),
				StreamUtil.map(m.getChildAssignments(),
						a -> (GraphEdgeAssignment) a));
	}

	@Override
	public double getCost(AnalysisContext ctx, int fiberRequiredStrands) {
		
		double dropCableCosts = fdtEquipment.getDropCableSummary().getCounts()
		.stream()
		.mapToDouble(s -> ctx.getPricingModel().getPrice(s.getDropCable()) * s.getCount()).sum() ;
		
		return dropCableCosts + ctx.getPricingModel().getMaterialCost(MaterialType.FDT);
	}

	public FDTEquipment getFdtEquipment() {
		return fdtEquipment;
	}

	public Collection<GraphEdgeAssignment> getAssignedLocations() {
		return locations;
	}
	

	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		return serializer.serialize(node, this) ;
	}

	@Override
	public DemandCoverage getDirectCoverage(AnalysisContext ctx) {
		DefaultFiberCoverage.Accumulator accumlator = DefaultFiberCoverage.accumulate() ;
		locations.forEach(l -> {
			LocationDropAssignment lda = (LocationDropAssignment) l.getAroEntity() ;
			accumlator.add(lda.getLocationEntity(), lda.getAggregateStatistic()) ;
		});
		return accumlator.getResult() ;
	}
}
