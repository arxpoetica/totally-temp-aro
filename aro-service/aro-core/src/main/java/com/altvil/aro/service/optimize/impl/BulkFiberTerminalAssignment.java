package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.optimize.spi.AnalysisContext;
import com.altvil.utils.StreamUtil;

public class BulkFiberTerminalAssignment extends AbstractEquipmentAssignment {

	private BulkFiberTerminal bftEquipment;
	private Collection<GraphEdgeAssignment> locations;

	public BulkFiberTerminalAssignment(GraphEdgeAssignment ga, BulkFiberTerminal bftEquipment,
			Collection<GraphEdgeAssignment> locations) {
		super(ga);
		this.bftEquipment = bftEquipment;
		this.locations = locations;

	}

	public BulkFiberTerminalAssignment(GraphMapping m) {
		this(m.getGraphAssignment(), (BulkFiberTerminal) m.getAroEntity(),
				StreamUtil.map(m.getChildAssignments(),
						a -> (GraphEdgeAssignment) a));
	}

	@Override
	public double getCost(AnalysisContext ctx, int fiberRequiredStrands) {
		
		ctx.getPricingModel().getMaterialCost(MaterialType.BFT) ;
		return ctx.getPricingModel().getMaterialCost(MaterialType.BFT) ;
	}

	public BulkFiberTerminal getbftEquipment() {
		return bftEquipment;
	}

	public Collection<GraphEdgeAssignment> getAssignedLocations() {
		return locations;
	}
	

	@Override
	public GraphMapping serialize(GeneratingNode node, ModelSerializer serializer) {
		//return serializer.serialize(node, this) ;
		return null ;
	}

	@Override
	public DemandCoverage getDirectCoverage(AnalysisContext ctx) {
		Set<LocationEntity> locationEntities = StreamUtil.mapSet(locations,
				l -> ((LocationDropAssignment) l.getAroEntity()).getLocationEntity());

		return DefaultFiberCoverage.create(locationEntities);
	}
}