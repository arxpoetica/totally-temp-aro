package com.altvil.aro.service.optimization.strategy.impl;

import java.util.function.Function;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.lbrary.finaance.Finance;
import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.optimization.strategy.spi.ComputedField;
import com.altvil.aro.service.optimization.strategy.spi.FinancialAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.roic.CashFlows;
import com.altvil.aro.service.roic.NetworkFinancialInput;
import com.altvil.aro.service.roic.RoicFinancialInput;
import com.altvil.aro.service.roic.RoicEngineService;

@Service
public class PlanAnalysisServiceImpl implements PlanAnalysisService {

	private RoicEngineService roicInputService;

	private static final Logger log = LoggerFactory
			.getLogger(PlanAnalysisServiceImpl.class.getName());

	@Autowired
	public PlanAnalysisServiceImpl(RoicEngineService roicInputService) {
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

	private NetworkFinancialInput toNetworkFinancialInput(
			RoicFinancialInput roicInput) {
		return new DefaultNetworkFinancialInput(true,
				roicInput.getFixedCosts(), roicInput.getDemandSummary()
						.getNetworkDemand(DemandTypeEnum.planned_demand)
						.getLocationDemand());
	}

	public FinancialAnalysis createFinancialAnalysis(
			Supplier<CashFlows> roicCashFlows,
			Supplier<CashFlows> fastCashFlows, double discountRate) {

		ComputedField<CashFlows> roicFlowsField = new SupplierComputedField<>(
				roicCashFlows);
		
		ComputedField<CashFlows> cashFlowField = new SupplierComputedField<>(
				fastCashFlows);
		

		return new DefaultFinancialAnalysis(null, cashFlowField,
				createField(() -> Finance.irr(cashFlowField.get()
						.getAsRawData())), createField(() -> Finance.npv(
						discountRate, cashFlowField.get().getAsRawData())),
				roicFlowsField, createField(() -> Finance.irr(roicFlowsField
						.get().getAsRawData())), createField(() -> Finance.npv(
						discountRate, roicFlowsField.get().getAsRawData())));
	};

	private Supplier<CashFlows> createCashFlowSupplier(
			RoicFinancialInput financialInput) {
		return () -> roicInputService.createRoicCashFlows(financialInput);
	}

	private Supplier<CashFlows> createCashFlowSupplier(
			NetworkFinancialInput basicInput, int years) {
		return () -> roicInputService.createCashFlows(SpeedCategory.cat7,
				basicInput, years);
	}

	@Override
	public FinancialAnalysis createFinancialAnalysis(
			RoicFinancialInput financialInput, int years, double discountRate) {
		return createFinancialAnalysis(
				createCashFlowSupplier(financialInput),
				createCashFlowSupplier(toNetworkFinancialInput(financialInput),
						years), discountRate);
	}

	private Function<NetworkFinancialInput, FinancialAnalysis> createFinancialAnalysis(
			int years, double discountRate) {
		
		return (networkFinancials) -> {
			Supplier<CashFlows> s = createCashFlowSupplier(networkFinancials,
					years);
			return createFinancialAnalysis(s, s, discountRate);
		};
	}

	public Function<NetworkFinancialInput, CashFlows> createCashFlowFunction(
			int years) {
		return (inputs) -> roicInputService.createCashFlows(SpeedCategory.cat7,
				inputs, years);
	}

	public Function<NetworkFinancialInput, CashFlows> createRoicCashFlowFunction(
			int years) {
		return (inputs) -> roicInputService.createCashFlows(SpeedCategory.cat7,
				inputs, years);
	}

	private static class DefaultFinancialAnalysis implements FinancialAnalysis {
		private NetworkFinancialInput networkFiancials;

		private ComputedField<CashFlows> cashFlows;
		private ComputedField<Double> irr;
		private ComputedField<Double> npv;

		private ComputedField<CashFlows> roicCashFlows;
		private ComputedField<Double> roicIrr;
		private ComputedField<Double> roicNpv;

		public DefaultFinancialAnalysis(NetworkFinancialInput networkFiancials,
				ComputedField<CashFlows> cashFlows, ComputedField<Double> irr,
				ComputedField<Double> npv,
				ComputedField<CashFlows> roicCashFlows,
				ComputedField<Double> roicIrr, ComputedField<Double> roicNpv) {
			super();
			this.networkFiancials = networkFiancials;

			this.irr = irr;
			this.npv = npv;
			this.cashFlows = cashFlows;

			this.roicCashFlows = roicCashFlows;
			this.roicIrr = roicIrr;
			this.roicNpv = roicNpv;
		}

		@Override
		public double getRoicIrr() {
			return roicIrr.get();
		}

		@Override
		public double getRoicNpv() {
			return roicNpv.get();
		}

		@Override
		public CashFlows getRoicCashFlows() {
			return roicCashFlows.get();
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
		public CashFlows getRoicCashFlows() {
			return financialAnalysis.getRoicCashFlows();
		}

		@Override
		public double getRoicIrr() {
			return financialAnalysis.getRoicIrr();
		}

		@Override
		public double getRoicNpv() {
			return financialAnalysis.getRoicNpv();
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

	private static ComputedField<Double> createField(Supplier<Double> s) {
		return new SupplierComputedField<Double>(makeSafe(s, Double.NaN));
	}

	private static <D> Supplier<D> makeSafe(Supplier<D> s, D errorValue) {
		return () -> {
			try {
				return s.get();
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return errorValue;
			}
		};

	}

	private static class SupplierComputedField<D> implements ComputedField<D> {

		private Supplier<D> supplier;
		private boolean computed = false;
		private D value = null;

		public SupplierComputedField(Supplier<D> supplier) {
			super();
			this.supplier = supplier;
		}

		@Override
		public D get() {
			if (!computed) {
				value = supplier.get();
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
