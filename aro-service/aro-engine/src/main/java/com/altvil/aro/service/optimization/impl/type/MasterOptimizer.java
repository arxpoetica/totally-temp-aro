package com.altvil.aro.service.optimization.impl.type;

import java.util.Collection;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.impl.NetworkDemandSummaryImpl;
import com.altvil.aro.service.optimization.impl.PlanCommandExecutorService;
import com.altvil.aro.service.optimization.master.GeneratedMasterPlan;
import com.altvil.aro.service.optimization.master.MasterPlanningService;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService.ExecutorType;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.enumerations.OptimizationType;
import com.altvil.utils.StreamUtil;

public abstract class MasterOptimizer {
	@Autowired
	protected AroDemandService aroDemandService;
	@Autowired
	protected SerializationService conversionService;
	private final Logger log = LoggerFactory.getLogger(MasterOptimizer.class
			.getName());
	@Autowired
	protected MasterPlanningService masterPlanningService;
	@Autowired
	protected NetworkPlanRepository networkPlanRepository;
	@Autowired
	protected OptimizationExecutorService optimizationExecutorService;

	private OptimizationExecutor wirecenterExecutor;

	@Autowired
	private PlanCommandExecutorService planCommandExecutorService;

	@Autowired
	protected WirecenterPlanningService wirecenterPlanningService;

	protected Collection<WirecenterOptimizationRequest> computeWireCenterRequests(
			MasterOptimizationRequest request) {

		return planCommandExecutorService.createLayerCommands(request).stream()
				.map(ProcessLayerCommand::getServiceAreaCommands)
				.flatMap(Collection::stream).collect(Collectors.toList());
	}

	protected void deleteWireCenterPlans(MasterOptimizationRequest request) {
		networkPlanRepository.deleteWireCenterPlans(request.getPlanId());
	}

	protected <S> Collection<S> evaluateWirecenterCommands(
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

	public abstract boolean isOptimizerFor(OptimizationType type);

	public OptimizedMasterPlan optimize(MasterOptimizationRequest request) {
		try {

			deleteWireCenterPlans(request);

			Collection<PlannedNetwork> plannedNetworks = planNetworks(request,
					computeWireCenterRequests(request));

			Collection<OptimizedPlan> optimizedNetworks = updateNetworks(
					request.getOptimizationConstraints(), plannedNetworks);

			final GeneratedMasterPlanImpl generatedMasterPlan = new GeneratedMasterPlanImpl(
					request, optimizedNetworks);

			optimizedNetworks.stream().forEach(
					(optimizedNetwork) -> wirecenterPlanningService
							.save(optimizedNetwork));

			OptimizedMasterPlan op = masterPlanningService
					.createOptimizedMasterPlan(generatedMasterPlan);

			return masterPlanningService.save(op);
		} catch (Throwable err) {
			log.error(err.getMessage(), err);
			throw new RuntimeException(err.getMessage(), err);
		}

	}

	protected abstract Collection<PlannedNetwork> planNetworks(
			MasterOptimizationRequest request,
			Collection<WirecenterOptimizationRequest> wirecenters);

	@PostConstruct
	void postConstruct() {
		wirecenterExecutor = optimizationExecutorService
				.createOptimizationExecutor(ExecutorType.Wirecenter);
	}

	protected OptimizedPlan reify(OptimizationConstraints constraints,
			PlannedNetwork plan) {

		WirecenterNetworkPlan reifiedPlan = conversionService.convert(
				plan.getPlanId(), Optional.of(plan.getPlannedNetwork()));

		NetworkDemandSummary demandSummary = toNetworkDemandSummary(
				reifiedPlan.getDemandCoverage(),
				plan.getCompetitiveDemandMapping());

		log.debug("ds ====>" + demandSummary.toString());

		final GeneratedPlanImpl generatedPlan = new GeneratedPlanImpl(
				demandSummary, constraints, reifiedPlan);
		return wirecenterPlanningService.optimizedPlan(generatedPlan);

	}

	protected <S> Collection<ComputeUnitCallable<WirecenterOptimization<S>>> toCommands(
			Collection<WirecenterOptimizationRequest> requests,
			Function<WirecenterOptimizationRequest, ComputeUnitCallable<WirecenterOptimization<S>>> cmdBuilder) {
		return StreamUtil.map(requests, w -> cmdBuilder.apply(w));
	}

	protected NetworkDemandSummary toNetworkDemandSummary(DemandCoverage dc,
			CompetitiveDemandMapping mapping) {

		Collection<CompetitiveLocationDemandMapping> plannedDemand = dc
				.getLocations().stream()
				.map(l -> mapping.getLocationDemandMapping(l.getObjectId()))
				.collect(Collectors.toList());

		return NetworkDemandSummaryImpl
				.build()
				.add(DemandTypeEnum.planned_demand, SpeedCategory.cat7,
						dc.getLocationDemand())

				.add(DemandTypeEnum.new_demand,
						SpeedCategory.cat7,
						aroDemandService.aggregateDemandForSpeedCategory(
								mapping.getAllDemandMapping(),
								SpeedCategory.cat7))

				.add(DemandTypeEnum.original_demand,
						SpeedCategory.cat3,
						aroDemandService.aggregateDemandForSpeedCategory(
								plannedDemand, SpeedCategory.cat3))

				.build();

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
}

class GeneratedMasterPlanImpl implements GeneratedMasterPlan {

	private MasterOptimizationRequest masterOptimizationRequest;
	private Collection<OptimizedPlan> optimizedPlans;

	public GeneratedMasterPlanImpl(
			MasterOptimizationRequest masterOptimizationRequest,
			Collection<OptimizedPlan> optimizedPlans) {
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

class GeneratedPlanImpl implements GeneratedPlan {

	private NetworkDemandSummary networkDemandSummary;
	private OptimizationConstraints optimizationConstraints;
	private WirecenterNetworkPlan wirecenterNetworkPlan;

	public GeneratedPlanImpl(NetworkDemandSummary networkDemandSummary,
			OptimizationConstraints optimizationConstraints,
			WirecenterNetworkPlan wirecenterNetworkPlan) {
		super();
		this.networkDemandSummary = networkDemandSummary;
		this.optimizationConstraints = optimizationConstraints;
		this.wirecenterNetworkPlan = wirecenterNetworkPlan;
	}

	@Override
	public NetworkDemandSummary getDemandSummary() {
		return networkDemandSummary;
	}

	@Override
	public OptimizationConstraints getOptimizationConstraints() {
		return optimizationConstraints;
	}

	@Override
	public WirecenterNetworkPlan getWirecenterNetworkPlan() {
		return wirecenterNetworkPlan;
	}

}