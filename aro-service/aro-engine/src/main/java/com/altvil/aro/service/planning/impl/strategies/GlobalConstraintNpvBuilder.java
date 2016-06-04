package com.altvil.aro.service.planning.impl.strategies;

import java.util.Collection;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.FiberNetworkConstraintsBuilder;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.GlobalConstraintBuilder;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type = GlobalConstraintBuilder.class, algorithms = FiberPlanAlgorithm.NPV)
public class GlobalConstraintNpvBuilder implements GlobalConstraintBuilder {
	public static final double EQUIPMENT_PER_COVERAGE = 76.5;

	public static final double FIBER_PER_M			  = 5.28;

	private class NpvBudgetConstraint implements GlobalConstraint {
		public NpvBudgetConstraint(double budget) {
			this.budget = budget;
		}

		private final Logger		log			 = LoggerFactory.getLogger(NpvBudgetConstraint.class);
		private final double budget;
		private double		 minMarketPenetration = 0;
		private double		 maxMarketPenetration = 1;
		private double		 marketPenetration	  = maxMarketPenetration;

		@Override
		public double nextParametric() {
			return marketPenetration;
		}

		@Override
		public boolean isConverging(DAGModel<GeoSegment> model) {
			double cost = cost(model);
			log.debug("marketPenetration = " + marketPenetration + "; cost = " + cost);
			
			if (cost < budget) {
				minMarketPenetration = marketPenetration;
			} else {
				maxMarketPenetration = marketPenetration;
			}

			marketPenetration = (minMarketPenetration + maxMarketPenetration) / 2;

			return (maxMarketPenetration - minMarketPenetration) > 0.01;
		}

		private double cost(DAGModel<GeoSegment> model) {
			return cost(model.getEdges());
		}

		private double cost(Set<AroEdge<GeoSegment>> edges) {
			return edges.stream().mapToDouble(GlobalConstraintNpvBuilder::cost).sum();
		}

	}

	private static double cost(AroEdge<GeoSegment> edge) {
		GeoSegment segment = edge.getValue();
		final double[] cost = { 0 };

		if (segment != null) {
			Collection<GraphEdgeAssignment> assignments = segment.getGeoSegmentAssignments();

			assignments.forEach((assignment) -> {
				LocationEntity le = (LocationEntity) assignment.getAroEntity();
				LocationDemand d = le.getLocationDemand();
				cost[0] += d.getRawCoverage() * EQUIPMENT_PER_COVERAGE;
			});
		}

		return cost[0];
	}

	@Override
	public GlobalConstraint build(FiberPlan fiberPlan) {
		NpvFiberPlan nfp = (NpvFiberPlan) fiberPlan;

		if (nfp.getBudget() == Double.POSITIVE_INFINITY) {
			return null;
		}

		return new NpvBudgetConstraint(nfp.getBudget());
	}
}
