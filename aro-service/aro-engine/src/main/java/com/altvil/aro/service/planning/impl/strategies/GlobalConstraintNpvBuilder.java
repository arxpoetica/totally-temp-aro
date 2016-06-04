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
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.GlobalConstraintBuilder;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type = GlobalConstraintBuilder.class, algorithms = FiberPlanAlgorithm.NPV)
public class GlobalConstraintNpvBuilder implements GlobalConstraintBuilder {
	public static final double EQUIPMENT_PER_COVERAGE = 76.5;

	public static final double FIBER_PER_M			  = 5.28;

	private class NpvBudgetConstraint implements GlobalConstraint {
		public NpvBudgetConstraint(double budget, double discountRate, int years) {
			this.budget = budget;
			
			npvFactor = 0;
			for (int t = 1; t <= years; t++) {
				npvFactor += 1 / Math.pow(1 + discountRate, t);
			}

		}
		
		private double npvFactor;

		private final Logger		log			 = LoggerFactory.getLogger(NpvBudgetConstraint.class);
		private final double budget;
		private double		 minMarketPenetration = 0;
		private double		 maxMarketPenetration = 1;
		private double		 marketPenetration	  = maxMarketPenetration;
		private boolean once = true;

		@Override
		public double nextParametric() {
			return marketPenetration;
		}

		@Override
		public boolean isConverging(DAGModel<GeoSegment> model) {
			double[] financials = financials(model);
			if (once) {
				log.debug(
						"marketPenetration, Scaled Cost, Scaled Revenue, Total Locations, Total Demand, NPV");
				once = false;
			}
			log.debug("{}, {}, {}, {}, {}, {}" , marketPenetration, 
					financials[0], financials[1],
					financials[2], financials[3], 					
					(npvFactor *  financials[1] * marketPenetration) - (financials[0] * marketPenetration));
			
			if (financials[0] < budget) {
				minMarketPenetration = marketPenetration;
			} else {
				maxMarketPenetration = marketPenetration;
			}

			marketPenetration = (minMarketPenetration + maxMarketPenetration) / 2;

			return (maxMarketPenetration - minMarketPenetration) > 0.00001;
		}

		private double[] financials(DAGModel<GeoSegment> model) {
			return financials(model.getEdges());
		}

		private double[] financials(Set<AroEdge<GeoSegment>> edges) {
			double[] results = new double[4];
			edges.stream().forEach((e) -> financials(e, results));
			return results;
		}
		
		private void financials(AroEdge<GeoSegment> edge, double[] results) {
			GeoSegment segment = edge.getValue();
			
			results[0] += edge.getWeight() * FIBER_PER_M;

			if (segment != null) {
				Collection<GraphEdgeAssignment> assignments = segment.getGeoSegmentAssignments();

				assignments.forEach((assignment) -> {
					LocationEntity le = (LocationEntity) assignment.getAroEntity();
					LocationDemand d = le.getLocationDemand();
					results[0] += d.getRawCoverage() * EQUIPMENT_PER_COVERAGE * marketPenetration;
					results[1] += d.getMonthlyRevenueImpact() * marketPenetration;
					results[2]++;
					results[3] += d.getRawCoverage();
				});
			}
		}
	}

	@Override
	public GlobalConstraint build(FiberPlan fiberPlan) {
		NpvFiberPlan nfp = (NpvFiberPlan) fiberPlan;

		if (nfp.getBudget() == Double.POSITIVE_INFINITY) {
			return null;
		}

		return new NpvBudgetConstraint(nfp.getBudget(), nfp.getDiscountRate(), nfp.getYears());
	}
}
