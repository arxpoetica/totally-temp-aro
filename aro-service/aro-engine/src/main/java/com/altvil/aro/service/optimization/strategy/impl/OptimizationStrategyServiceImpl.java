package com.altvil.aro.service.optimization.strategy.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.master.PruningAnalysis;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategy;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategyService;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import com.altvil.aro.service.optimization.wirecenter.OptimizedWirecenter;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.enumerations.OptimizationType;

public class OptimizationStrategyServiceImpl implements
		OptimizationStrategyService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(OptimizationStrategyServiceImpl.class);

	private Map<OptimizationType, OptimizationStrategyFactory<?>> strategyMap = new EnumMap<OptimizationType, OptimizationStrategyServiceImpl.OptimizationStrategyFactory<?>>(
			OptimizationType.class);

	private PlanAnalysisService planAnalysisService;
	private SerializationService serializationService;

	@PostConstruct
	void postConstruct() {
		init();
	}
	
	@SuppressWarnings("unchecked")
	private <T extends OptimizationConstraints> OptimizationStrategyFactory<T> getFactory(T constraints) {
		return (OptimizationStrategyFactory<T>) strategyMap.get(constraints) ;
	}

	private <T extends OptimizationConstraints> SpiOptimizationStrategy createSpiOptimizationStrategy(
			T constraints) {
		return getFactory(constraints).createOptimizationStrategy(constraints) ;
	}

	@Override
	public OptimizationStrategy getOptimizationStrategy(
			OptimizationConstraints constraints) {
		return createSpiOptimizationStrategy(constraints) ;
	}

	@Override
	public PruningStrategy getPruningStrategy(
			OptimizationConstraints constraints) {
		return new DefaultPruningStrategy(createSpiOptimizationStrategy(constraints));
	}

	@Override
	public ScoringStrategy getScoringStrategy(
			OptimizationConstraints constraints) {
		return null;
	}

	private interface SpiOptimizationStrategy extends OptimizationStrategy {
		public boolean isValid(OptimizedNetwork network);
	}

	private Function<OptimizedNetwork, PlanAnalysis> createPlanAnalysisFunctor(
			OptimizationConstraints constraints) {
		return planAnalysisService.createPlanAnalysis(constraints.getYears(),
				constraints.getDiscountRate());
	}

	private <T extends OptimizationConstraints> void register(
			OptimizationType type, OptimizationStrategyFactory<T> f) {
		strategyMap.put(type, f);
	}

	private void init() {
		register(OptimizationType.BUDGET_IRR, new ThresholdOptizationFactory<>(
				(plan) -> plan.getIrr()));
		register(OptimizationType.BUDGET_THRESHHOLD_IRR,
				new ThresholdOptizationFactory<>((plan) -> plan.getIrr()));
		register(OptimizationType.IRR, new ThresholdOptizationFactory<>(
				(plan) -> plan.getIrr()));
		register(OptimizationType.TARGET_IRR, new ThresholdOptizationFactory<>(
				(plan) -> plan.getIrr()));

		register(OptimizationType.COVERAGE, new ThresholdOptizationFactory<>((
				plan) -> plan.getCoverage()));

		register(OptimizationType.CAPEX, new ThresholdOptizationFactory<>(
				(plan) -> plan.getBudget()));

		register(OptimizationType.NPV, new ThresholdOptizationFactory<>(
				(plan) -> plan.getNpv()));

	}

	private class DefaultPruningStrategy implements PruningStrategy {

		private SpiOptimizationStrategy spiOptimizationStrategy;

		public DefaultPruningStrategy(
				SpiOptimizationStrategy spiOptimizationStrategy) {
			super();
			this.spiOptimizationStrategy = spiOptimizationStrategy;
		}

		@Override
		public boolean isGeneratingNodeValid(GeneratingNode node) {
			return true;
		}

		@Override
		public boolean isConstraintSatisfied(NetworkAnalysis node) {
			return false;
		}

		@Override
		public boolean isNetworkRejected(OptimizedNetwork network) {
			return spiOptimizationStrategy.isValid(network);
		}

	}

	private interface OptimizationStrategyFactory<T extends OptimizationConstraints> {
		SpiOptimizationStrategy createOptimizationStrategy(T constraints);
	}

	private class ThresholdOptizationFactory<T extends ThresholdBudgetConstraint>
			implements OptimizationStrategyFactory<T> {

		private ThesholdFunction thresholdFunction;

		public ThresholdOptizationFactory(ThesholdFunction thresholdFunction) {
			super();
			this.thresholdFunction = thresholdFunction;
		}

		@Override
		public SpiOptimizationStrategy createOptimizationStrategy(T constraints) {

			boolean thresholdActive = Double.NaN != constraints.getThreshhold();
			boolean capexActive = Double.NaN != constraints.getCapex();

			if (thresholdActive && capexActive) {
				return createBudgetThresholdStrategy(constraints);
			}

			if (thresholdActive) {
				return createThesholdStrategy(constraints);
			}

			if (capexActive) {
				return createBudgetStrategy(constraints);
			}

			return createMaxStrategy(constraints);
		}

		protected SpiOptimizationStrategy createBudgetThresholdStrategy(
				T constraints) {
			return new BudgetThresholdStrategy<ThresholdBudgetConstraint>(
					constraints, createPlanAnalysisFunctor(constraints),
					thresholdFunction);
		}

		protected SpiOptimizationStrategy createBudgetStrategy(T constraints) {
			return new BudgetStrategy<ThresholdBudgetConstraint>(constraints,
					createPlanAnalysisFunctor(constraints), thresholdFunction);
		}

		protected SpiOptimizationStrategy createThesholdStrategy(T constraints) {
			return new ThreshholdStrategy<ThresholdBudgetConstraint>(
					constraints, createPlanAnalysisFunctor(constraints),
					thresholdFunction);
		}

		protected SpiOptimizationStrategy createMaxStrategy(T constraints) {
			return new MaxStrategy<>(constraints,
					createPlanAnalysisFunctor(constraints));
		}
	}

	private interface ThesholdFunction {
		double getValue(PlanAnalysis planAnalysis);
	}

	private abstract class AbstractOptimizationStrategy<T extends OptimizationConstraints>
			implements OptimizationStrategy, SpiOptimizationStrategy {

		protected T optimizationConstraints;
		private Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor;

		public AbstractOptimizationStrategy(T optimizationConstraints,
				Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor) {
			super();
			this.optimizationConstraints = optimizationConstraints;
			this.planAnalysisFunctor = planAnalysisFunctor;
		}

		@Override
		public Collection<OptimizedWirecenter> evaluateNetworks(
				PruningAnalysis analysis) {
			return analysis.getPrunedNetworks().stream()
					.map(this::evaluateNetwork).filter(Optional::isPresent)
					.map(Optional::get).collect(Collectors.toList());
		}

		@Override
		public boolean isValid(OptimizedNetwork node) {
			return isValid(planAnalysisFunctor.apply(node));
		}

		protected boolean isValid(PlanAnalysis planAnalysis) {
			return planAnalysis.isValid();
		}

		protected OptimizedWirecenter toOptimizedWirecenter(
				PrunedNetwork prunedNetwork, Optional<PlanAnalysis> plan) {

			return new OptimizedWirecenter(
					prunedNetwork.getOptimizationRequest(),
					serializationService.convert(prunedNetwork.getPlanId(),
							plan.get().getOptimizedNetwork().getNetworkPlan()));

		}

		@Override
		public Optional<OptimizedWirecenter> evaluateNetwork(
				PrunedNetwork prunedNetwork) {

			Collection<PlanAnalysis> plans = prunedNetwork
					.getOptimizedNetworks().stream()
					.map(n -> planAnalysisFunctor.apply(n))
					.filter(PlanAnalysis::isValid).collect(Collectors.toList());

			Optional<PlanAnalysis> selectedPlan = selectPlan(plans);

			return selectedPlan.isPresent() ? Optional
					.of(toOptimizedWirecenter(prunedNetwork, selectedPlan))
					: Optional.empty();

		}

		protected abstract Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans);
	}

	private class MaxStrategy<T extends ThresholdBudgetConstraint> extends
			AbstractOptimizationStrategy<T> {
		public MaxStrategy(T optimizationConstraints,
				Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor) {
			super(optimizationConstraints, planAnalysisFunctor);
		}

		@Override
		protected Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans) {
			return plans.stream().max(
					(c1, c2) -> Double.compare(c1.getIrr(), c2.getIrr()));
		}
	}

	private class BudgetStrategy<T extends ThresholdBudgetConstraint> extends
			AbstractOptimizationStrategy<T> {

		private ThesholdFunction thresholdFunction;

		public BudgetStrategy(T optimizationConstraints,
				Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor,
				ThesholdFunction thresholdFunction) {
			super(optimizationConstraints, planAnalysisFunctor);
			this.thresholdFunction = thresholdFunction;
		}

		@Override
		protected boolean isValid(PlanAnalysis planAnalysis) {
			return super.isValid(planAnalysis)
					&& planAnalysis.getBudget() <= optimizationConstraints
							.getCapex();
		}

		@Override
		protected Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans) {
			return plans
					.stream()
					.filter(this::isValid)
					.sorted((c1, c2) -> Double.compare(
							thresholdFunction.getValue(c1),
							thresholdFunction.getValue(c2))
							* -1).findFirst();

		}
	}

	private class ThreshholdStrategy<T extends ThresholdBudgetConstraint>
			extends AbstractOptimizationStrategy<T> {

		private ThesholdFunction thresholdFunction;

		public ThreshholdStrategy(T optimizationConstraints,
				Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor,
				ThesholdFunction thresholdFunction) {
			super(optimizationConstraints, planAnalysisFunctor);
			this.thresholdFunction = thresholdFunction;
		}

		@Override
		protected boolean isValid(PlanAnalysis planAnalysis) {
			return super.isValid(planAnalysis)
					&& thresholdFunction.getValue(planAnalysis) >= optimizationConstraints
							.getThreshhold();
		}

		@Override
		protected Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans) {
			return plans
					.stream()
					.filter(this::isValid)
					.sorted((c1, c2) -> Double.compare(
							thresholdFunction.getValue(c1),
							thresholdFunction.getValue(c2))
							* -1).findFirst();

		}
	}

	private class BudgetThresholdStrategy<T extends ThresholdBudgetConstraint>
			extends AbstractOptimizationStrategy<T> {

		private ThesholdFunction thresholdFunction;

		public BudgetThresholdStrategy(T optimizationConstraints,
				Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor,
				ThesholdFunction thresholdFunction) {
			super(optimizationConstraints, planAnalysisFunctor);
			this.thresholdFunction = thresholdFunction;
		}

		@Override
		protected boolean isValid(PlanAnalysis planAnalysis) {
			return super.isValid(planAnalysis)
					&& planAnalysis.getBudget() <= optimizationConstraints
							.getCapex()
					&& thresholdFunction.getValue(planAnalysis) >= optimizationConstraints
							.getThreshhold();
		}

		@Override
		protected Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans) {
			return plans
					.stream()
					.filter(this::isValid)
					.sorted((c1, c2) -> Double.compare(
							thresholdFunction.getValue(c1),
							thresholdFunction.getValue(c2))
							* -1).findFirst();

		}
	}
	
	
	private static class ScoringStrategyFactory {

		private Map<OptimizationType, ScoringStrategy> map = new EnumMap<>(OptimizationType.class) ;
		
		@PostConstruct
		public void init() {
			map.put(OptimizationType.CAPEX, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getRawCoverage()))) ;
			map.put(OptimizationType.COVERAGE, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getRawCoverage()))) ;
//			map.put(OptimizationType.PENETRATION, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getDemand()))) ;
//			map.put(OptimizationType.IRR, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getMonthlyRevenueImpact()))) ;
		}
		
		private static final double divide(double a, double b) {
			if( b == 0 ) {
				return 0 ;
			}
			return a / b ;
		}
		
		public ScoringStrategy getScoringStrategy(OptimizationType optimizationType) {
			return map.get(optimizationType) ;
		}
		

	}


}
