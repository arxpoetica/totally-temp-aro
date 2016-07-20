package com.altvil.aro.service.optimization.strategy.impl;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.strategy.StrategyUtils;
import com.altvil.aro.service.optimization.strategy.spi.ComputedField;
import com.altvil.aro.service.optimization.strategy.spi.FinancialAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.NetworkFinancials;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;

@Service
public class PlanAnalysisServiceImpl implements PlanAnalysisService {

	@Override
	public Function<OptimizedNetwork, PlanAnalysis> createPlanAnalysis(
			int years, double discountRate) {

		return null;

	}

	@Override
	public Function<NetworkFinancials, FinancialAnalysis> createFinancialAnalysis(
			int years, double discountRate) {
		Function<NetworkFinancials, Double> irrFunc = createIrrAnalysis(years);
		Function<NetworkFinancials, Double> npvFunc = createNpvAnalysis(years,
				discountRate);

		return (networkFinancials) -> {
			return new DefaultFinancialAnalysis(networkFinancials,
					new DefaultComputedField<NetworkFinancials, Double>(
							networkFinancials, irrFunc),
					new DefaultComputedField<NetworkFinancials, Double>(
							networkFinancials, npvFunc));
		};
	}

	private Function<NetworkFinancials, Double> createIrrAnalysis(int years) {
		return (analysisNode) -> {
			double capex = analysisNode.getFixedCosts();
			double annualRevenue = analysisNode.getAnnualRevenue();
			return StrategyUtils.calculateIrr(capex, annualRevenue, years);
		};
	}

	private Function<NetworkFinancials, Double> createNpvAnalysis(int years,
			double discountRate) {
		return (analysisNode) -> {
			double capex = analysisNode.getFixedCosts();
			double annualRevenue = analysisNode.getAnnualRevenue();
			return StrategyUtils.npv(capex, annualRevenue, discountRate, years);
		};
	}

	private static class DefaultFinancialAnalysis implements FinancialAnalysis {
		private NetworkFinancials networkFiancials;

		private ComputedField<Double> irr;
		private ComputedField<Double> npv;
		
		public DefaultFinancialAnalysis(NetworkFinancials networkFiancials,
				ComputedField<Double> irr, ComputedField<Double> npv) {
			super();
			this.networkFiancials = networkFiancials;
			this.irr = irr;
			this.npv = npv;

		}

		@Override
		public double getCoverage() {
			throw new RuntimeException(
					"Implement this. Requires initial state of all locations");
		}

//		private static boolean evalValid(NetworkFinancials network) {
//
//			return network.isValid();
//
//			// if (network == null || network.isEmpty()) {
//			// return false;
//			// }
//			//
//			// if (network.getAnalysisNode().getCapex() <= 0) {
//			// return false;
//			// }
//			//
//			// if (network.getAnalysisNode().getFiberCoverage().getAtomicUnits()
//			// <= 0) {
//			// return false;
//			// }
//
//			return true;
//
//		}

		@Override
		public boolean isValid() {
			return networkFiancials.isValid() ;
		}

		public double getIrr() {
			return irr.get();
		}

		public double getNpv() {
			return npv.get();
		}

		public double getBudget() {
			return networkFiancials.getFixedCosts();
		}

	}
	
	private static class DefaultPlanAnalysis implements PlanAnalysis {
		
		private NetworkFinancials networkFinancials ;
		private OptimizedNetwork optimizedNetwork ;
		private FinancialAnalysis financialAnalysis ;
		
		
		public DefaultPlanAnalysis(NetworkFinancials networkFinancials,
				OptimizedNetwork optimizedNetwork,
				FinancialAnalysis financialAnalysis) {
			super();
			this.networkFinancials = networkFinancials;
			this.optimizedNetwork = optimizedNetwork;
			this.financialAnalysis = financialAnalysis;
		}


		@Override
		public FinancialAnalysis getFinancialAnalysis() {
			return financialAnalysis ;
		}
		

		@Override
		public NetworkFinancials getNetworkFinancials() {
			return networkFinancials;
		}



		@Override
		public OptimizedNetwork getOptimizedNetwork() {
			return optimizedNetwork ;;
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
