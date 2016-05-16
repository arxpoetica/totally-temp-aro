package com.altvil.aro.service.planning.fiber.strategies;

import java.util.Collection;
import java.util.function.Predicate;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;

public abstract class AbstractFiberPlanConfigurationNpv<FP extends NpvFiberPlan> extends AbstractFiberPlanConfiguration<FP> {

	public AbstractFiberPlanConfigurationNpv(FP fiberPlan) {
		super(fiberPlan);
	}

	@Override
	public FP getFiberPlan() {
		return fiberPlan;
	}

	@Override
	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	@Override
	public boolean isFilteringRoadLocationsBySelection() {
		return false;
	}

	@Override
	public Predicate<AroEdge<GeoSegment>> getSelectedEdges(NetworkData networkData) {
		return (e) ->
		{
			GeoSegment value = e.getValue();
			
			if (value == null) {
				return false;
			}
			Collection<Long> selectedRoadLocationIds = networkData.getSelectedRoadLocationIds();
			
			for(GraphEdgeAssignment geoSegmentAssignments: value.getGeoSegmentAssignments()) {
				Object ae = geoSegmentAssignments.getAroEntity();
				if (ae instanceof LocationEntity) {
					LocationEntity le = (LocationEntity) ae;
					
					if (selectedRoadLocationIds.contains(le.getObjectId())) {
						return true;
					}
				}
				
			}
			
			return false;
		};
	}

	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (g, s) -> new NpvClosestFirstIterator<GraphNode, AroEdge<GeoSegment>>(getFiberPlan().getDiscountRate(), getFiberPlan().getYears(), g, s);
	}

}
