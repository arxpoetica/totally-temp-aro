package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.Optional;
import java.util.concurrent.Future;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.ProcessLayerCommand;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.impl.type.NpvPlanningOptimizer;
import com.altvil.aro.service.optimization.master.GeneratedMasterPlan;
import com.altvil.aro.service.optimization.master.MasterPlanningService;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService.ExecutorType;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorFactory;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.utils.StreamUtil;

@Service
public class OptimizationPlannerServiceImpl implements
		OptimizationPlannerService {

	private static final Logger log = LoggerFactory
			.getLogger(OptimizationPlannerServiceImpl.class.getName());

	private OptimizationEvaluatorFactory strategyService;
	private WirecenterOptimizationService wirecenterOptimizationService;
	private OptimizationExecutorService optimizationExecutorService;

	private MasterPlanningService masterPlanningService;

	private OptimizationExecutor wirecenterExecutor;
	private OptimizationExecutor masterPlanExecutor;
	private PlanCommandService planCommandExecutorService;
	private NpvPlanningOptimizer npvPlanningOptimizer;

	@Autowired
	public OptimizationPlannerServiceImpl(
			PlanCommandService planCommandExecutorService,
			OptimizationEvaluatorFactory strategyService,
			WirecenterOptimizationService wirecenterOptimizationService,
			OptimizationExecutorService optimizationExecutorService,
			MasterPlanningService masterPlanningService,
			NpvPlanningOptimizer npvPlanningOptimizer) {
		super();
		this.planCommandExecutorService = planCommandExecutorService;
		this.strategyService = strategyService;
		this.wirecenterOptimizationService = wirecenterOptimizationService;
		this.optimizationExecutorService = optimizationExecutorService;
		this.masterPlanningService = masterPlanningService;
		this.npvPlanningOptimizer = npvPlanningOptimizer;
	}

	@PostConstruct
	void postConstruct() {
		wirecenterExecutor = optimizationExecutorService
				.createOptimizationExecutor(ExecutorType.Wirecenter);

		masterPlanExecutor = optimizationExecutorService
				.createOptimizationExecutor(ExecutorType.MasterPlan);
	}

	@Override
	public Future<OptimizedMasterPlan> optimize(
			MasterOptimizationRequest request) {
		MasterOptimizer masterOptimizer = createMasterOptimizer(request);
		return masterPlanExecutor.submit(() -> masterOptimizer
				.optimize(request));
	}

	private MasterOptimizer createMasterOptimizer(
			MasterOptimizationRequest request) {

		switch (request.getAlgorithmType()) {
		case PLANNING:
			return new PlanningOptimizer();
		case PRUNING:
			return new PruningOptimizer(
					strategyService.getOptimizationEvaluator(
							(ThresholdBudgetConstraint) request
									.getOptimizationConstraints(), request
									.getOptimizationMode()));
		case EXPANDED_ROUTING:
			return new ExpandedNpvRouting();
		case ROUTING:
		default:
			throw new RuntimeException("Operation not Supported");
		}

	}

	private abstract class MasterOptimizer {

		OptimizedMasterPlan optimize(MasterOptimizationRequest request) {

			try {

				Collection<PlannedNetwork> plannedNetworks = planNetworks(computeWireCenterRequests(request));

				Collection<OptimizedPlan> optimizedNetworks = updateNetworks(
						request.getOptimizationConstraints(), plannedNetworks);

				return masterPlanningService.save(new GeneratedMasterPlanImpl(
						request, optimizedNetworks));
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				throw new RuntimeException(err.getMessage(), err);
			}

		}

		protected abstract Collection<PlannedNetwork> planNetworks(
				Collection<ProcessLayerCommand> serviceAreas);

		protected OptimizedPlan reify(OptimizationConstraints constraints,
				PlannedNetwork plan) {
			return planCommandExecutorService.reifyPlanSummarizeAndSave(
					constraints, plan);
		}

		protected Collection<OptimizedPlan> updateNetworks(
				OptimizationConstraints constraints,
				Collection<PlannedNetwork> plannedNetworks) {

			try {

				return plannedNetworks.stream().map(p -> reify(constraints, p))
						.collect(Collectors.toList());
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				throw new RuntimeException(err.getMessage(), err);
			}

		}

		protected Collection<WirecenterOptimizationRequest> toServiceAreaCommands(
				Collection<ProcessLayerCommand> layerCommands) {
			return layerCommands.stream()
					.map(ProcessLayerCommand::getServiceAreaCommands)
					.flatMap(Collection::stream).collect(Collectors.toList());
		}

		protected Collection<ProcessLayerCommand> computeWireCenterRequests(
				MasterOptimizationRequest request) {
			planCommandExecutorService.deleteOldPlans(request.getPlanId());
			return planCommandExecutorService.createLayerCommands(request);
		}

		protected <S> Collection<ComputeUnitCallable<WirecenterOptimization<S>>> toCommands(
				Collection<WirecenterOptimizationRequest> requests,
				Function<WirecenterOptimizationRequest, ComputeUnitCallable<WirecenterOptimization<S>>> cmdBuilder) {
			return StreamUtil.map(requests, w -> cmdBuilder.apply(w));
		}

	}

	private class PlanningOptimizer extends MasterOptimizer {

		private ComputeUnitCallable<WirecenterOptimization<Optional<PlannedNetwork>>> asCommand(
				WirecenterOptimizationRequest request) {
			return () -> {
				try {
					return new DefaultOptimizationResult<>(request,
							wirecenterOptimizationService.planNetwork(request));
				} catch (Throwable err) {
					log.error(err.getMessage(), err);
					return new DefaultOptimizationResult<>(request,
							new OptimizationException(err.getMessage()));
				}
			};

		}

		@Override
		protected Collection<PlannedNetwork> planNetworks(
				Collection<ProcessLayerCommand> layerCommands) {

			return evaluateWirecenterCommands(
					toCommands(toServiceAreaCommands(layerCommands),
							this::asCommand), Optional::isPresent).stream()
					.map(Optional::get).collect(Collectors.toList());

		}
	}

	private class ExpandedNpvRouting extends MasterOptimizer {

		@Override
		protected Collection<PlannedNetwork> planNetworks(
				Collection<ProcessLayerCommand> layerCommands) {
			return evaluateWirecenterCommands(
					toCommands(toServiceAreaCommands(layerCommands),
							npvPlanningOptimizer::asCommand),
					Optional::isPresent).stream().map(Optional::get)
					.collect(Collectors.toList());
		}

	}

	private class PruningOptimizer extends MasterOptimizer {

		private OptimizationEvaluator optimizationEvaluator;

		public PruningOptimizer(OptimizationEvaluator optimizationEvaluator) {
			super();
			this.optimizationEvaluator = optimizationEvaluator;
		}

		private ComputeUnitCallable<WirecenterOptimization<PrunedNetwork>> asCommand(
				WirecenterOptimizationRequest request) {
			return () -> {
				try {
					return new DefaultOptimizationResult<>(request,
							wirecenterOptimizationService.pruneNetwork(request));
				} catch (Throwable err) {
					log.error(err.getMessage(), err);
					return new DefaultOptimizationResult<>(request,
							new OptimizationException(err.getMessage()));
				}
			};

		}

		@Override
		protected Collection<PlannedNetwork> planNetworks(
				Collection<ProcessLayerCommand> layerCommands) {

			Collection<PrunedNetwork> prunedNetworks = evaluateWirecenterCommands(
					toCommands(toServiceAreaCommands(layerCommands),
							this::asCommand), n -> !n.isEmpty());

			return optimizationEvaluator.evaluateNetworks(prunedNetworks);

		}

	}

	private <S> Collection<S> evaluateWirecenterCommands(
			Collection<ComputeUnitCallable<WirecenterOptimization<S>>> cmds,
			Predicate<S> validPredicate) {

		return wirecenterExecutor
				.invokeAll(cmds)
				.stream()
				.map(f -> {
					try {
						return f.get();
					} catch (Exception e) {
						log.error(e.getMessage(), e);
						return new DefaultOptimizationResult<S>(null,
								new OptimizationException(e.getMessage()));
					}
				}).filter(o -> !o.isInError())
				.map(WirecenterOptimization::getResult).filter(validPredicate)
				.collect(Collectors.toList());

	}

	private static class GeneratedMasterPlanImpl implements GeneratedMasterPlan {

		private MasterOptimizationRequest masterOptimizationRequest;
		private Collection<OptimizedPlan> optimizedPlans;

		public GeneratedMasterPlanImpl(
				MasterOptimizationRequest masterOptimizationRequest,
				Collection<OptimizedPlan> optimizedPlans) {
			super();
			this.masterOptimizationRequest = masterOptimizationRequest;
			this.optimizedPlans = optimizedPlans;
		}

		@Override
		public MasterOptimizationRequest getOptimizationRequest() {
			return masterOptimizationRequest;
		}

		@Override
		public Collection<OptimizedPlan> getOptimizedPlans() {
			return optimizedPlans;
		}
	}

}
