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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategy;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategyService;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultPlannedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.enumerations.OptimizationType;

@Service
public class OptimizationStrategyServiceImpl implements
		OptimizationStrategyService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(OptimizationStrategyServiceImpl.class);

	private Map<OptimizationType, OptimizationStrategyFactory<?>> strategyMap = new EnumMap<OptimizationType, OptimizationStrategyServiceImpl.OptimizationStrategyFactory<?>>(
			OptimizationType.class);

	private PlanAnalysisService planAnalysisService;

	@Autowired
	public OptimizationStrategyServiceImpl(
			PlanAnalysisService planAnalysisService) {
		super();
		this.planAnalysisService = planAnalysisService;
	}

	@PostConstruct
	void postConstruct() {
		init();
	}

	@SuppressWarnings("unchecked")
	private <T extends OptimizationConstraints> OptimizationStrategyFactory<T> getFactory(
			T constraints) {
		return (OptimizationStrategyFactory<T>) strategyMap.get(constraints
				.getOptimizationType());
	}

	private <T extends OptimizationConstraints> SpiOptimizationStrategy createSpiOptimizationStrategy(
			T constraints) {
		return getFactory(constraints).createOptimizationStrategy(constraints);
	}

	@Override
	public OptimizationStrategy getOptimizationStrategy(
			OptimizationConstraints constraints) {
		return createSpiOptimizationStrategy(constraints);
	}

	@Override
	public PruningStrategy getPruningStrategy(
			OptimizationConstraints constraints) {
		return new DefaultPruningStrategy(
				createSpiOptimizationStrategy(constraints));
	}

	@Override
	public ScoringStrategy getScoringStrategy(
			OptimizationConstraints constraints) {
		return ScoringStrategyFactory.FACTORY.getScoringStrategy(constraints
				.getOptimizationType());
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
		public boolean isCandidatePlan(OptimizedNetwork network) {
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

			boolean thresholdActive = !Double
					.isNaN(constraints.getThreshhold());
			boolean capexActive = !Double.isNaN(constraints.getCapex())
					&& !Double.isInfinite(constraints.getCapex());

			if (thresholdActive && capexActive) {
				return createBudgetThresholdStrategy(constraints);
			}

			if (thresholdActive) {
				return createThresholdStrategy(constraints);
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

		protected SpiOptimizationStrategy createThresholdStrategy(T constraints) {
			return new ThreshholdStrategy<ThresholdBudgetConstraint>(
					constraints, createPlanAnalysisFunctor(constraints),
					thresholdFunction);
		}

		protected SpiOptimizationStrategy createMaxStrategy(T constraints) {
			return new MaxStrategy<>(constraints,
					createPlanAnalysisFunctor(constraints), thresholdFunction);
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
		public Collection<PlannedNetwork> evaluateNetworks(
				Collection<PrunedNetwork> analysis) {
			return analysis.stream().map(this::evaluateNetwork)
					.filter(Optional::isPresent).map(Optional::get)
					.collect(Collectors.toList());

		}

		@Override
		public boolean isValid(OptimizedNetwork node) {
			return isValid(planAnalysisFunctor.apply(node));
		}

		protected boolean isValid(PlanAnalysis planAnalysis) {
			return planAnalysis.isValid();
		}

		protected Optional<PlannedNetwork> toPlannedNetwork(long planId,
				Optional<PlanAnalysis> plan) {

			if (!plan.isPresent()) {
				return Optional.empty();
			}

			Optional<CompositeNetworkModel> p = plan.get()
					.getOptimizedNetwork().getNetworkPlan();
			if (!p.isPresent()) {
				return Optional.empty();
			}

			return Optional.of(new DefaultPlannedNetwork(planId, plan.get()
					.getOptimizedNetwork().getNetworkPlan().get()));

		}

		@Override
		public Optional<PlannedNetwork> evaluateNetwork(
				PrunedNetwork prunedNetwork) {

			Collection<PlanAnalysis> plans = prunedNetwork
					.getOptimizedNetworks().stream()
					.map(n -> planAnalysisFunctor.apply(n))
					.filter(PlanAnalysis::isValid).collect(Collectors.toList());

			return toPlannedNetwork(prunedNetwork.getPlanId(),
					selectPlan(plans));

		}

		protected abstract Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans);
	}

	private class MaxStrategy<T extends ThresholdBudgetConstraint> extends
			AbstractOptimizationStrategy<T> {

		private ThesholdFunction thresholdFunction;

		public MaxStrategy(T optimizationConstraints,
				Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor,
				ThesholdFunction thresholdFunction) {
			super(optimizationConstraints, planAnalysisFunctor);
			this.thresholdFunction = thresholdFunction;
		}

		@Override
		protected Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans) {
			return plans.stream().max(
					(c1, c2) -> Double.compare(thresholdFunction.getValue(c1),
							thresholdFunction.getValue(c2)));
		}
	}

	private class BudgetStrategy<T extends ThresholdBudgetConstraint> extends
			AbstractOptimizationStrategy<T> {

		// private ThesholdFunction thresholdFunction;

		public BudgetStrategy(T optimizationConstraints,
				Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor,
				ThesholdFunction thresholdFunction) {
			super(optimizationConstraints, planAnalysisFunctor);
			// this.thresholdFunction = thresholdFunction;
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
					.sorted((c1, c2) -> Double.compare(c1.getBudget(),
							c2.getBudget())
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
					.sorted((c1, c2) -> Double.compare(c1.getBudget(),
							c2.getBudget())
							* -1).findFirst();

		}
	}

	private static class ScoringStrategyFactory {

		public static final ScoringStrategyFactory FACTORY = new ScoringStrategyFactory();

		private ScoringStrategyFactory() {
			init();
		}

		private Map<OptimizationType, ScoringStrategy> map = new EnumMap<>(
				OptimizationType.class);

		public void init() {
			map.put(OptimizationType.IRR,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getMonthlyRevenueImpact())));

			map.put(OptimizationType.BUDGET_IRR,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getMonthlyRevenueImpact())));
			map.put(OptimizationType.BUDGET_THRESHHOLD_IRR,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getMonthlyRevenueImpact())));
			map.put(OptimizationType.TARGET_IRR,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getMonthlyRevenueImpact())));

			map.put(OptimizationType.CAPEX,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getRawCoverage())));
			map.put(OptimizationType.PRUNNING_NPV,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getRawCoverage())));
			map.put(OptimizationType.COVERAGE,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getMonthlyRevenueImpact())));
			map.put(OptimizationType.NPV,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getMonthlyRevenueImpact())));

		}

		private static final double divide(double a, double b) {
			if (b == 0) {
				return 0;
			}
			return a / b;
		}

		public ScoringStrategy getScoringStrategy(
				OptimizationType optimizationType) {
			return map.get(optimizationType);
		}

	}

}
