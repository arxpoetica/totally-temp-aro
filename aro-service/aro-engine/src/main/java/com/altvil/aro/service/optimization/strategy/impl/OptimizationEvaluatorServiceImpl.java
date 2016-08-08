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
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorService;
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

@Service("singleEvaluator")
public class OptimizationEvaluatorServiceImpl implements
		OptimizationEvaluatorService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(OptimizationEvaluatorServiceImpl.class);

	private Map<OptimizationType, OptimizationStrategyFactory<?>> strategyMap = new EnumMap<OptimizationType, OptimizationEvaluatorServiceImpl.OptimizationStrategyFactory<?>>(
			OptimizationType.class);

	private ApplicationContext appContext ;
	private PlanAnalysisService planAnalysisService;

	@Autowired
	public OptimizationEvaluatorServiceImpl(
			ApplicationContext appContext,
			PlanAnalysisService planAnalysisService) {
		super();
		this.appContext = appContext ;
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

	private <T extends OptimizationConstraints> SpiOptimizationEvaluator createSpiOptimizationStrategy(
			T constraints) {
		return getFactory(constraints).createOptimizationStrategy(constraints);
	}

	@Override
	public OptimizationEvaluator getOptimizationEvaluator(
			ThresholdBudgetConstraint constraints) {
		return createSpiOptimizationStrategy(constraints);
	}



	private interface SpiOptimizationEvaluator extends OptimizationEvaluator {
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
		register(OptimizationType.IRR, new ThresholdOptizationFactory<>(
				(plan) -> plan.getIrr()));
		
		register(OptimizationType.COVERAGE, new ThresholdOptizationFactory<>((
				plan) -> plan.getCoverage()));

		register(OptimizationType.CAPEX, new ThresholdOptizationFactory<>(
				(plan) -> plan.getBudget()));

		register(OptimizationType.NPV, new ThresholdOptizationFactory<>(
				(plan) -> plan.getNpv()));

	}

	private class DefaultPruningStrategy implements PruningStrategy {

		private SpiOptimizationEvaluator spiOptimizationStrategy;

		public DefaultPruningStrategy(
				SpiOptimizationEvaluator spiOptimizationStrategy) {
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
		SpiOptimizationEvaluator createOptimizationStrategy(T constraints);
	}

	private class ThresholdOptizationFactory<T extends ThresholdBudgetConstraint>
			implements OptimizationStrategyFactory<T> {

		private ThesholdFunction thresholdFunction;

		public ThresholdOptizationFactory(ThesholdFunction thresholdFunction) {
			super();
			this.thresholdFunction = thresholdFunction;
		}

		@Override
		public SpiOptimizationEvaluator createOptimizationStrategy(T constraints) {

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

		protected SpiOptimizationEvaluator createBudgetThresholdStrategy(
				T constraints) {
			return new BudgetThresholdEvaluator<ThresholdBudgetConstraint>(
					constraints, createPlanAnalysisFunctor(constraints),
					thresholdFunction);
		}

		protected SpiOptimizationEvaluator createBudgetStrategy(T constraints) {
			return new BudgetEvaluator<ThresholdBudgetConstraint>(constraints,
					createPlanAnalysisFunctor(constraints), thresholdFunction);
		}

		protected SpiOptimizationEvaluator createThresholdStrategy(T constraints) {
			return new ThreshholdEvaluator<ThresholdBudgetConstraint>(
					constraints, createPlanAnalysisFunctor(constraints),
					thresholdFunction);
		}

		protected SpiOptimizationEvaluator createMaxStrategy(T constraints) {
			return new MaxEvaluator<>(constraints,
					createPlanAnalysisFunctor(constraints), thresholdFunction);
		}
	}

	private interface ThesholdFunction {
		double getValue(PlanAnalysis planAnalysis);
	}

	private abstract class AbstractOptimizationEvaluator<T extends OptimizationConstraints>
			implements OptimizationEvaluator, SpiOptimizationEvaluator {

		protected T optimizationConstraints;
		private Function<OptimizedNetwork, PlanAnalysis> planAnalysisFunctor;

		public AbstractOptimizationEvaluator(T optimizationConstraints,
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
				Optional<PlanAnalysis> plan,
				CompetitiveDemandMapping demandMapping) {

			if (!plan.isPresent()) {
				return Optional.empty();
			}

			Optional<CompositeNetworkModel> p = plan.get()
					.getOptimizedNetwork().getNetworkPlan(appContext);
			if (!p.isPresent()) {
				return Optional.empty();
			}

			return Optional.of(new DefaultPlannedNetwork(planId, plan.get()
					.getOptimizedNetwork().getNetworkPlan(appContext).get(),
					demandMapping));

		}

		public Optional<PlannedNetwork> evaluateNetwork(
				PrunedNetwork prunedNetwork) {

			Collection<PlanAnalysis> plans = prunedNetwork
					.getOptimizedNetworks().stream()
					.map(n -> planAnalysisFunctor.apply(n))
					.filter(PlanAnalysis::isValid).collect(Collectors.toList());

			return toPlannedNetwork(prunedNetwork.getPlanId(),
					selectPlan(plans),
					prunedNetwork.getCompetitiveDemandMapping());

		}
		@Override
		public PruningStrategy getPruningStrategy() {
			return new DefaultPruningStrategy(
					createSpiOptimizationStrategy(optimizationConstraints));
		}

		@Override
		public ScoringStrategy getScoringStrategy() {
			return ScoringStrategyFactory.FACTORY.getScoringStrategy(optimizationConstraints.getOptimizationType());
		}
		protected abstract Optional<PlanAnalysis> selectPlan(
				Collection<PlanAnalysis> plans);
	}

	private class MaxEvaluator<T extends ThresholdBudgetConstraint> extends
			AbstractOptimizationEvaluator<T> {

		private ThesholdFunction thresholdFunction;

		public MaxEvaluator(T optimizationConstraints,
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

	private class BudgetEvaluator<T extends ThresholdBudgetConstraint> extends
			AbstractOptimizationEvaluator<T> {

		// private ThesholdFunction thresholdFunction;

		public BudgetEvaluator(T optimizationConstraints,
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
					.max((c1, c2) -> Double.compare(c1.getBudget(),
							c2.getBudget()));

		}
	}

	private class ThreshholdEvaluator<T extends ThresholdBudgetConstraint>
			extends AbstractOptimizationEvaluator<T> {

		private ThesholdFunction thresholdFunction;

		public ThreshholdEvaluator(T optimizationConstraints,
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

	private class BudgetThresholdEvaluator<T extends ThresholdBudgetConstraint>
			extends AbstractOptimizationEvaluator<T> {

		private ThesholdFunction thresholdFunction;

		public BudgetThresholdEvaluator(T optimizationConstraints,
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

			map.put(OptimizationType.CAPEX,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getFairShareDemand())));
			map.put(OptimizationType.PRUNNING_NPV,
					(node) -> -(divide(node.getCapex(), node.getFiberCoverage()
							.getFairShareDemand())));
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
