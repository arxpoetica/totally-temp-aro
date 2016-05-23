package com.altvil.aro.service.planning.optimization.strategies;

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
import com.altvil.aro.service.planning.NpvOptimizationPlan;

public class OptimizationPlanConfigurationNpv extends OptimizationPlanConfiguration implements NpvOptimizationPlan {
	private static final long serialVersionUID = 1L;
	private double budget;
	private double				   discountRate;
	private int					   years;

	public OptimizationPlanConfigurationNpv(NpvOptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.budget = fiberPlan.getBudget();
		this.discountRate = fiberPlan.getDiscountRate();
		this.years = fiberPlan.getYears();
	}

	public double getBudget() {
		return budget;
	}

	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (g, s) -> new NpvClosestFirstIterator<GraphNode, AroEdge<GeoSegment>>(getDiscountRate(), getYears(), getBudget(), g,
				s);
	}

	public double getDiscountRate() {
		return discountRate;
	}

	@Override
	public Predicate<AroEdge<GeoSegment>> getSelectedEdges(NetworkData networkData) {
		return (e) -> {
			GeoSegment value = e.getValue();

			if (value == null) {
				return false;
			}
			Collection<Long> selectedRoadLocationIds = networkData.getSelectedRoadLocationIds();

			for (GraphEdgeAssignment geoSegmentAssignments : value.getGeoSegmentAssignments()) {
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

	public int getYears() {
		return years;
	}

	@Override
	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	@Override
	public boolean isFilteringRoadLocationsBySelection() {
		return false;
	}

	public void setBudget(double budget) {
		this.budget = budget;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public void setYears(int years) {
		this.years = years;
	}
}
