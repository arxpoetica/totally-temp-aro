package com.altvil.aro.service.planning.fiber.strategies;

import java.util.Collection;
import java.util.List;
import java.util.function.Predicate;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;

public class FiberPlanDefaultConfiguration<FP extends FiberPlan> extends AbstractFiberPlanConfiguration<FP> implements FiberPlanConfiguration<FP> {
		public FiberPlanDefaultConfiguration(FP fiberPlan) {
			super(fiberPlan);
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
				
				Collection<GraphEdgeAssignment> geoSegmentAssignments = value.getGeoSegmentAssignments();
				
				return geoSegmentAssignments.isEmpty();
			};
		}

		@Override
		public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
			return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
		}
	}