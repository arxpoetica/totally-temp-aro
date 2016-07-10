package com.altvil.aro.service.planning.impl.strategies;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.SimpleNetworkFinancials;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.GlobalConstraintBuilder;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

@FiberPlanStrategy(type = GlobalConstraintBuilder.class, algorithms = FiberPlanAlgorithm.NPV)
public class GlobalConstraintNpvBuilder implements GlobalConstraintBuilder {
	private class NpvBudgetConstraint implements GlobalConstraint {
		private double bestNpv = Double.NEGATIVE_INFINITY;
		private double bestNpvParametric = 0;
		private double bestOverBudget = Double.POSITIVE_INFINITY;
		private double bestOverBudgetParametric = 0;
		private final double budget;
		private double increment = 0;
		private final Logger log = LoggerFactory
				.getLogger(NpvBudgetConstraint.class);
		private int maxSteps = 0;
		private boolean once = true;
		private double parametric = 1;
		private int planIndex = 0;
		private int step = 0;
		private double discountRate;
		private int years;

		public NpvBudgetConstraint(double budget, double discountRate, int years) {
			this.budget = budget;
			this.discountRate = discountRate;
			this.years = years;
		}

		@Override
		public boolean isConverging(Object object) {
			WirecenterNetworkPlan plan = (WirecenterNetworkPlan) object;

			double fiberLength = 0;
			fiberLength += plan.getFiberLengthInMeters(FiberType.FEEDER);
			fiberLength += plan.getFiberLengthInMeters(FiberType.DISTRIBUTION);

			SimpleNetworkFinancials f = new SimpleNetworkFinancials(plan
					.getDemandCoverage().getLocationDemand(), fiberLength,
					discountRate, years);
			final double npv = f.getNpv();

			log.debug("{}, {}, {}, {}, {}, {}, {}, {}, {}", budget, parametric,
					f.getTotalCost(), f.getRevenue(), f.getFiberCost(), f
							.getEquipmentCost(), f.getFiberLength(), f
							.getLocationDemand().getRawCoverage(), npv);

			if (f.getTotalCost() < budget) {
				if (npv > bestNpv) {
					bestNpv = npv;
					bestNpvParametric = parametric;

					if (parametric == 1) {
						log.debug("Solved: Under budget");
						return false;
					}
				}
			} else {
				if (f.getTotalCost() < bestOverBudget) {
					bestOverBudget = f.getTotalCost();
					bestOverBudgetParametric = parametric;
				}
			}

			if (step++ < maxSteps) {
				parametric -= increment;
			} else if (planIndex < SEARCH_PLAN.length) {
				SearchPlan searchPlan = SEARCH_PLAN[planIndex++];
				increment = (parametric - searchPlan.lowerCutoff)
						/ (searchPlan.numProbs - 1);
				step = 0;
				maxSteps = searchPlan.numProbs;
				parametric -= increment;
			} else if (bestNpv > Double.NEGATIVE_INFINITY
					&& bestNpvParametric == parametric) {
				log.debug("Solved: Best NPV under budget");
				return false;
			} else if (bestOverBudget > Double.NEGATIVE_INFINITY
					&& bestOverBudgetParametric == parametric) {
				log.debug("Solved: Least over budget");
				return false;
			} else if (bestNpv > Double.NEGATIVE_INFINITY) {
				parametric = bestNpvParametric;
			} else {
				parametric = bestOverBudgetParametric;
			}

			log.debug("parametric = " + parametric);

			return true;
		}

		@Override
		public double nextParametric() {
			return parametric;
		}
	}

	private static class SearchPlan {
		final double lowerCutoff;
		final int numProbs;

		SearchPlan(int numProbs, double lowerCutoff) {
			this.numProbs = numProbs;
			this.lowerCutoff = lowerCutoff;
		}
	}

	private static final SearchPlan[] SEARCH_PLAN = { new SearchPlan(100, 0.3),
			new SearchPlan(200, 0.2), new SearchPlan(600, 0.0) };

	@Override
	public GlobalConstraint build(FiberPlan fiberPlan) {
		NpvFiberPlan nfp = (NpvFiberPlan) fiberPlan;

		if (nfp.getBudget() == Double.POSITIVE_INFINITY) {
			return null;
		}

		return new NpvBudgetConstraint(nfp.getBudget(), nfp.getDiscountRate(),
				nfp.getYears());
	}
}
