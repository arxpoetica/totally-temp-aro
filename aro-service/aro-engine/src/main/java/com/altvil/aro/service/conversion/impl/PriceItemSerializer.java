package com.altvil.aro.service.conversion.impl;

import java.util.Collection;

import com.altvil.aro.service.analysis.GraphMappingSerializer;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.utils.func.Aggregator;

public class PriceItemSerializer extends
		GraphMappingSerializer<PriceItemBuilder> {

	//private PricingModel pricingModel;

	public PriceItemSerializer(long planId) {
		super(planId);
	}

	@Override
	protected void serializeCentralOffice(PriceItemBuilder parent,
			GraphMapping graphMapping) {
	}

	@Override
	protected void serializeFdh(PriceItemBuilder parent,
			GraphMapping graphMapping) {
	}

	@Override
	protected void serializeFdt(PriceItemBuilder parent,
			GraphMapping graphMapping) {

		super.serializeFdt(parent, graphMapping);
	}

	@Override
	protected void serializeBulkFiberTerminals(PriceItemBuilder parent,
			GraphMapping graphMapping) {
		super.serializeBulkFiberTerminals(parent, graphMapping);
	}

	@Override
	protected void serializeSplicePoint(PriceItemBuilder parent,
			GraphMapping graphMapping) {
	}

	@Override
	protected void serializeLocationDropAssignment(PriceItemBuilder parent,
			GraphMapping graphMapping) {
		super.serializeLocationDropAssignment(parent, graphMapping);
	}

	protected void serializeLocations(Aggregator<LocationDemand> aggregator,
			Collection<GraphEdgeAssignment> edgeAssignments) {

		edgeAssignments.forEach(e -> {

			aggregator.add(((LocationDropAssignment) e)
					.getAssignedEntityDemand().getLocationDemand());
		});

	}

}
