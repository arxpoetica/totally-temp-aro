package com.altvil.aro.service.optimization.strategy.impl;

import java.util.function.Function;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.lbrary.finaance.Finance;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.optimization.strategy.spi.ComputedField;
import com.altvil.aro.service.optimization.strategy.spi.FinancialAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.roic.CashFlows;
import com.altvil.aro.service.roic.NetworkFinancialInput;
import com.altvil.aro.service.roic.RoicInputService;

@Service
public class PlanAnalysisServiceImpl implements PlanAnalysisService {

	private RoicInputService roicInputService;
	
	@Autowired
	public PlanAnalysisServiceImpl(RoicInputService roicInputService) {
		super();
		this.roicInputService = roicInputService;
	}

	@Override
	public Function<OptimizedNetwork, PlanAnalysis> createPlanAnalysis(
			int years, double discountRate) {

		return (optimizedNetwork) -> {
			NetworkFinancialInput input = toNetworkFinancialInput(optimizedNetwork);
			return new DefaultPlanAnalysis(input, optimizedNetwork,
					createFinancialAnalysis(years, discountRate).apply(input));
		};

	}

	private NetworkFinancialInput toNetworkFinancialInput(
			OptimizedNetwork network) {
		return new DefaultNetworkFinancialInput(evalValid(network), network
				.getAnalysisNode().getCapex(), network.getAnalysisNode()
				.getFiberCoverage().getLocationDemand());
	}

	@Override
	public Function<NetworkFinancialInput, FinancialAnalysis> createFinancialAnalysis(
			int years, double discountRate) {

		Function<NetworkFinancialInput, CashFlows> cashFlowFunction = createCashFlowFunction(years);
		Function<ComputedField<CashFlows>, Double> irrFunc = createIrrAnalysis();
		Function<ComputedField<CashFlows>, Double> npvFunc = createNpvAnalysis(discountRate);

		return (networkFinancials) -> {

			ComputedField<CashFlows> cashFlowField = new DefaultComputedField<>(
					networkFinancials, cashFlowFunction);

			return new DefaultFinancialAnalysis(networkFinancials,
					cashFlowField,
					new DefaultComputedField<ComputedField<CashFlows>, Double>(
							cashFlowField, irrFunc),
					new DefaultComputedField<ComputedField<CashFlows>, Double>(
							cashFlowField, npvFunc));
		};
	}

	public Function<NetworkFinancialInput, CashFlows> createCashFlowFunction(
			int years) {
		return (inputs) -> roicInputService.createCashFlows(SpeedCategory.cat7,
				inputs, years);
	}

	private Function<ComputedField<CashFlows>, Double> createIrrAnalysis() {
		return (cashFlow) -> {
			return Finance.irr(cashFlow.get().getAsRawData());
		};
	}

	private Function<ComputedField<CashFlows>, Double> createNpvAnalysis(
			double discountRate) {
		return (cashFlow) -> {
			return Finance.npv(discountRate, cashFlow.get().getAsRawData());
		};
	}

	private static class DefaultFinancialAnalysis implements FinancialAnalysis {
		private NetworkFinancialInput networkFiancials;

		private ComputedField<CashFlows> cashFlows;
		private ComputedField<Double> irr;
		private ComputedField<Double> npv;

		public DefaultFinancialAnalysis(NetworkFinancialInput networkFiancials,
				ComputedField<CashFlows> cashFlows, ComputedField<Double> irr,
				ComputedField<Double> npv) {
			super();
			this.networkFiancials = networkFiancials;
			this.irr = irr;
			this.npv = npv;
			this.cashFlows = cashFlows;
		}

		@Override
		public double getCoverage() {
			throw new RuntimeException(
					"Implement this. Requires initial state of all locations");
		}

		@Override
		public CashFlows getCashFlows() {
			return cashFlows.get();
		}

		@Override
		public boolean isValid() {
			return networkFiancials.isValid();
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

		private NetworkFinancialInput networkFinancials;
		private OptimizedNetwork optimizedNetwork;
		private FinancialAnalysis financialAnalysis;

		public DefaultPlanAnalysis(NetworkFinancialInput networkFinancials,
				OptimizedNetwork optimizedNetwork,
				FinancialAnalysis financialAnalysis) {
			super();
			this.networkFinancials = networkFinancials;
			this.optimizedNetwork = optimizedNetwork;
			this.financialAnalysis = financialAnalysis;
		}

		@Override
		public CashFlows getCashFlows() {
			return financialAnalysis.getCashFlows();
		}

		@Override
		public boolean isValid() {
			return networkFinancials.isValid();
		}

		@Override
		public double getIrr() {
			return financialAnalysis.getIrr();
		}

		@Override
		public double getNpv() {
			return financialAnalysis.getNpv();
		}

		@Override
		public double getBudget() {
			return financialAnalysis.getBudget();
		}

		@Override
		public double getCoverage() {
			return financialAnalysis.getCoverage();
		}

		@Override
		public NetworkFinancialInput getNetworkFinancials() {
			return networkFinancials;
		}

		@Override
		public OptimizedNetwork getOptimizedNetwork() {
			return optimizedNetwork;
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
				computed = true ;
				return value;
			}
			return value;
		}
	}

	private static boolean evalValid(OptimizedNetwork network) {

		if (network == null || network.isEmpty()) {
			return false;
		}

		if (network.getAnalysisNode().getCapex() <= 0) {
			return false;
		}

		if (network.getAnalysisNode().getFiberCoverage().getAtomicUnits() <= 0) {
			return false;
		}

		return true;

	}

}
