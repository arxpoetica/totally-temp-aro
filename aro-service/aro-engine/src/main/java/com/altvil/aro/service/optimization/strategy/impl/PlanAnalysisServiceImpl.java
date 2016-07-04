package com.altvil.aro.service.optimization.strategy.impl;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.strategy.StrategyUtils;
import com.altvil.aro.service.optimization.strategy.spi.ComputedField;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;

@Service
public class PlanAnalysisServiceImpl implements PlanAnalysisService {

	@Override
	public Function<OptimizedNetwork, PlanAnalysis> createPlanAnalysis(
			int years, double discountRate) {

		Function<AnalysisNode, Double> irrFunc = createIrrAnalysis(years);
		Function<AnalysisNode, Double> npvFunc = createNpvAnalysis(years,
				discountRate);

		return (optimizedNetwork) -> {
			AnalysisNode analysisNode = optimizedNetwork.getAnalysisNode();
			return new DefaultPlanAnalysis(optimizedNetwork,
					new DefaultComputedField<AnalysisNode, Double>(
							analysisNode, irrFunc),
					new DefaultComputedField<AnalysisNode, Double>(
							analysisNode, npvFunc));
		};

	}

	private Function<AnalysisNode, Double> createIrrAnalysis(int years) {
		return (analysisNode) -> {
			double capex = analysisNode.getCapex();
			double annualRevenue = 12 * analysisNode.getFiberCoverage()
					.getMonthlyRevenueImpact();
			return StrategyUtils.calculateIrr(capex, annualRevenue, years);
		};
	}

	private Function<AnalysisNode, Double> createNpvAnalysis(int years,
			double discountRate) {
		return (analysisNode) -> {
			double capex = analysisNode.getCapex();
			double annualRevenue = 12 * analysisNode.getFiberCoverage()
					.getMonthlyRevenueImpact();
			return StrategyUtils.npv(capex, annualRevenue, discountRate, years);
		};
	}

	private static class DefaultPlanAnalysis implements PlanAnalysis {
		private OptimizedNetwork optimizedNetwork;

		private ComputedField<Double> irr;
		private ComputedField<Double> npv;

		private boolean valid;

		public DefaultPlanAnalysis(OptimizedNetwork optimizedNetwork,
				ComputedField<Double> irr, ComputedField<Double> npv) {
			super();
			this.optimizedNetwork = optimizedNetwork;
			this.irr = irr;
			this.npv = npv;
			
			this.valid = evalValid(optimizedNetwork) ;

		}
		
		@Override
		public double getCoverage() {
			throw new RuntimeException("Implement this. Requires initial state of all locations");
		}

		private static boolean evalValid(OptimizedNetwork network) {
			if (network == null || network.isEmpty()) {
				return false;
			}

			if (network.getAnalysisNode().getCapex() <= 0) {
				return false;
			}

			if (network.getAnalysisNode().getFiberCoverage().getDemand() <= 0) {
				return false;
			}

			return true;

		}

		@Override
		public boolean isValid() {
			return valid;
		}

		@Override
		public OptimizedNetwork getOptimizedNetwork() {
			return optimizedNetwork;
		}

		public double getIrr() {
			return irr.get();
		}

		public double getNpv() {
			return npv.get();
		}

		public double getScore() {
			return optimizedNetwork.getAnalysisNode().getScore();
		}

		public double getBudget() {
			return optimizedNetwork.getAnalysisNode().getCapex();
		}

	}

	private static class DefaultComputedField<S, D> implements ComputedField<D> {

		public DefaultComputedField(S source, Function<S, D> f) {
			super();
			this.source = source;
			this.f = f;
		}

		private S source;
		private Function<S, D> f;

		private D value = null;
		private boolean computed = false;

		@Override
		public D get() {
			if (!computed) {
				value = f.apply(source);
				return value;
			}
			return value;
		}
	}

}
