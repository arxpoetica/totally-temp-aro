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
	private static class BasicFinanceEstimator {
		private double cost;

		private double equipmentCost = 0.0;

		private double fiberCost;

		private double length;

		private int	   numLocations;

		private double rawCoverage;

		private double revenue;

		private BasicFinanceEstimator(DAGModel<GeoSegment> model) {
			financials(model.getEdges());
		}

		private void financials(AroEdge<GeoSegment> edge) {
			GeoSegment segment = edge.getValue();

			length += edge.getWeight();
			fiberCost += edge.getWeight() * FIBER_PER_M;

			if (segment != null) {
				Collection<GraphEdgeAssignment> assignments = segment.getGeoSegmentAssignments();

				assignments.forEach((assignment) -> {
					LocationEntity le = (LocationEntity) assignment.getAroEntity();
					LocationDemand d = le.getLocationDemand();
					equipmentCost += d.getRawCoverage() * EQUIPMENT_PER_COVERAGE;
					revenue += d.getMonthlyRevenueImpact() * 12;
					numLocations++;
					rawCoverage += d.getRawCoverage();
				});
			}

			cost = fiberCost + equipmentCost;
		}

		private void financials(Set<AroEdge<GeoSegment>> edges) {
			edges.stream().forEach((e) -> financials(e));
		}

		public double getCost() {
			return cost;
		}

		public double getEquipmentCost() {
			return equipmentCost;
		}

		public double getFiberCost() {
			return fiberCost;
		}

		public double getLength() {
			return length;
		}

		public int getNumLocations() {
			return numLocations;
		}

		public double getRawCoverage() {
			return rawCoverage;
		}

		public double getRevenue() {
			return revenue;
		}
	}

	private class NpvBudgetConstraint implements GlobalConstraint {
		private double		 bestNpv				  = Double.NEGATIVE_INFINITY;
		private double		 bestNpvParametric		  = 0;
		private double		 bestOverBudget			  = Double.POSITIVE_INFINITY;
		private double		 bestOverBudgetParametric = 0;
		private final double budget;
		private double		 increment				  = 0;
		private final Logger log					  = LoggerFactory.getLogger(NpvBudgetConstraint.class);
		private int			 maxSteps				  = 0;
		private double		 npvFactor;
		private boolean		 once					  = true;
		private double		 parametric				  = 1;
		private int			 planIndex				  = 0;
		private int			 step					  = 0;

		public NpvBudgetConstraint(double budget, double discountRate, int years) {
			this.budget = budget;

			npvFactor = 0;
			for (int t = 1; t <= years; t++) {
				npvFactor += 1 / Math.pow(1 + discountRate, t);
			}

		}

		@Override
		public boolean isConverging(DAGModel<GeoSegment> model) {
			BasicFinanceEstimator estimator = new BasicFinanceEstimator(model);
			
			if (once) {
				log.debug(
						"budget, scale, Scaled Cost, Scaled Revenue, Fiber Cost, Equipment Cost, Total Locations, Path Length, Total Demand, NPV");
				once = false;
			}
			
			final double npv = (npvFactor * estimator.getRevenue()) - estimator.getCost();
			
			log.debug("{}, {}, {}, {}, {}, {}, {}, {}, {}, {}", budget, parametric, estimator.getCost(),
					estimator.getRevenue(), estimator.getFiberCost(), estimator.getEquipmentCost(),
					estimator.getNumLocations(), estimator.getLength(), estimator.getRawCoverage(), npv);

			if (estimator.getCost() < budget) {
				if (npv > bestNpv) {
					bestNpv = npv;
					bestNpvParametric = parametric;

					if (parametric == 1) {
						return false;
					}
				}
			} else {
				if (estimator.getCost() < bestOverBudget) {
					bestOverBudget = estimator.getCost();
					bestOverBudgetParametric = parametric;
				}
			}

			if (step++ < maxSteps) {
				parametric -= increment;
			} else if (planIndex < SEARCH_PLAN.length) {
				SearchPlan searchPlan = SEARCH_PLAN[planIndex++];
				increment = (parametric - searchPlan.lowerCutoff) / (searchPlan.numProbs - 1);
				step = 0;
				maxSteps = searchPlan.numProbs;
				parametric -= increment;
			} else if (bestNpv > Double.NEGATIVE_INFINITY && bestNpvParametric == parametric) {
				return false;
			} else if (bestOverBudget > Double.NEGATIVE_INFINITY && bestOverBudgetParametric == parametric) {
				return false;
			} else if (bestNpv > Double.NEGATIVE_INFINITY) {
				parametric = bestNpvParametric;
			} else {
				parametric = bestOverBudgetParametric;
			}

			return true;
		}

		@Override
		public double nextParametric() {
			return parametric;
		}
	}

	private static class SearchPlan {
		final double lowerCutoff;
		final int	 numProbs;

		SearchPlan(int numProbs, double lowerCutoff) {
			this.numProbs = numProbs;
			this.lowerCutoff = lowerCutoff;
		}
	}

	public static final double		  EQUIPMENT_PER_COVERAGE = 76.5;

	public static final double		  FIBER_PER_M			 = 17.32;

	private static final SearchPlan[] SEARCH_PLAN			 = { new SearchPlan(100, 0.3), new SearchPlan(200, 0.2),
			new SearchPlan(600, 0.0) };

	@Override
	public GlobalConstraint build(FiberPlan fiberPlan) {
		NpvFiberPlan nfp = (NpvFiberPlan) fiberPlan;

		if (nfp.getBudget() == Double.POSITIVE_INFINITY) {
			return null;
		}

		return new NpvBudgetConstraint(nfp.getBudget(), nfp.getDiscountRate(), nfp.getYears());
	}
}
