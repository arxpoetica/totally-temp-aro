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
	public static final double EQUIPMENT_PER_COVERAGE = 0;//76.5;

	public static final double FIBER_PER_M			  = 17.32;
	private static final int NUM_PROBES = 1000;

	private class NpvBudgetConstraint implements GlobalConstraint {
		private static final int EQUIPMENT_COST = 6;

		private static final int FIBER_COST = 5;

		private static final int LENGTH = 4;

		private static final int RAW_COVERAGE = 3;

		private static final int TOTAL_LOCATIONS = 2;

		private static final int SCALED_REVENUE = 1;

		private static final int SCALED_COST = 0;

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
		private boolean once = true;
		private int step = 0;
		private double marketPenetration = 1;
		private double bestNpv = Double.NEGATIVE_INFINITY;
		private double bestMarketPenetration = 0;
		private double bestOverBudget = Double.POSITIVE_INFINITY;
		private double b =0;

		@Override
		public double nextParametric() {
			return marketPenetration;
		}

		@Override
		public boolean isConverging(DAGModel<GeoSegment> model) {
			double[] financials = financials(model);
			if (once) {
				log.debug(
						"budget, scale, Scaled Cost, Scaled Revenue, Fiber Cost, Equipment Cost, Total Locations, Path Length, Total Demand, NPV");
				once = false;
			}
			final double npv = (npvFactor *  financials[SCALED_REVENUE]) - financials[SCALED_COST];
			log.debug("{}, {}, {}, {}, {}, {}, {}, {}, {}, {}" ,
					budget, marketPenetration, 
					financials[SCALED_COST], financials[SCALED_REVENUE],financials[FIBER_COST], financials[EQUIPMENT_COST],
					financials[TOTAL_LOCATIONS], financials[LENGTH], financials[RAW_COVERAGE], 					
					npv);
			
			if (financials[0] < budget) {
				if (npv > bestNpv) {
					bestNpv = npv;
					bestMarketPenetration = marketPenetration;
					
					if (step == 0) {
						return false;
					}
				}
			} else {
				if (financials[0] < bestOverBudget) {
					bestOverBudget = financials[0];
					b = marketPenetration;
				}
			}
			
			if (step++ < NUM_PROBES) {
				marketPenetration -= 1.0 / (NUM_PROBES - 1.0);
			} else if (bestNpv > Double.NEGATIVE_INFINITY && bestMarketPenetration == marketPenetration) {
				return false;
			} else if (bestOverBudget > Double.NEGATIVE_INFINITY && b == marketPenetration) {
				return false;
			} else if (bestNpv == Double.NEGATIVE_INFINITY) {
				marketPenetration =  b;
			} else {
				marketPenetration =  bestMarketPenetration;
			}
			
			return true;
		}

		private double[] financials(DAGModel<GeoSegment> model) {
			return financials(model.getEdges());
		}

		private double[] financials(Set<AroEdge<GeoSegment>> edges) {
			double[] results = new double[7];
			edges.stream().forEach((e) -> financials(e, results));
			return results;
		}
		
		private void financials(AroEdge<GeoSegment> edge, double[] results) {
			GeoSegment segment = edge.getValue();
			
			results[SCALED_COST] += edge.getWeight() * FIBER_PER_M;
			results[LENGTH] += edge.getWeight();
			results[FIBER_COST] += edge.getWeight() * FIBER_PER_M;

			if (segment != null) {
				Collection<GraphEdgeAssignment> assignments = segment.getGeoSegmentAssignments();

				assignments.forEach((assignment) -> {
					LocationEntity le = (LocationEntity) assignment.getAroEntity();
					LocationDemand d = le.getLocationDemand();
					results[SCALED_COST] += d.getRawCoverage() * EQUIPMENT_PER_COVERAGE * marketPenetration;
					results[EQUIPMENT_COST] += d.getRawCoverage() * EQUIPMENT_PER_COVERAGE * marketPenetration;
					results[SCALED_REVENUE] += d.getMonthlyRevenueImpact() * 3;// * marketPenetration;
					results[TOTAL_LOCATIONS]++;
					results[RAW_COVERAGE] += d.getRawCoverage();
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
