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
import com.altvil.aro.service.planning.fiber.AbstractFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.planning.fiber.NpvFiberPlan;

public class FiberPlanConfigurationNpv implements FiberPlanConfiguration {
		private final NpvFiberPlan fiberPlan;
		
		public FiberPlanConfigurationNpv(AbstractFiberPlan fiberPlan) {
			this.fiberPlan = (NpvFiberPlan) fiberPlan;
		}

		private double getDiscountRate() {
			return fiberPlan.getDiscountRate();
		}

		private int getYears() {
			return fiberPlan.getPeriods();
		}

		@Override
		public AbstractFiberPlan getFiberPlan() {
			return fiberPlan;
		}
		
//		private List<Long> selectedLocations = null;
//
//		@Override
//		@Deprecated
//		public List<Long> getSelectedRoadLocationIds$() {
//			if (selectedLocations == null) {
//			List<BigInteger> selectedLocationsAsBigIntegers = planRepository.querySelectedLocationsByPlanId(getFiberPlan().getPlanId());
//			selectedLocations = selectedLocationsAsBigIntegers.stream().mapToLong(bi -> bi.longValue()).boxed().collect(Collectors.toList());
//			}
//			
//			return selectedLocations;
//		}

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
			return (g, s) -> new NpvClosestFirstIterator<GraphNode, AroEdge<GeoSegment>>(getDiscountRate(), getYears(), g, s);
		}

		@Override
		public FiberPlanConfiguration dependentPlan(long dependentId) {
			return new FiberPlanConfigurationNpv(getFiberPlan().dependentFiberPlan(dependentId));
		}
	}