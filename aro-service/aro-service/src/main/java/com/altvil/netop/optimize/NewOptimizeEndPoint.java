package com.altvil.netop.optimize;

import java.util.Collection;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.demand.LocationTypeMask;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimization.constraints.CapexConstraints;
import com.altvil.aro.service.optimization.constraints.CoverageConstraints;
import com.altvil.aro.service.optimization.constraints.DefaultConstraints;
import com.altvil.aro.service.optimization.constraints.IrrConstraints;
import com.altvil.aro.service.optimization.constraints.NpvConstraints;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.root.OptimizedRootPlan;
import com.altvil.aro.service.optimization.root.RootOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.RootOptimizationRequest;
import com.altvil.aro.service.scheduler.SchedulerService;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.enumerations.AlgorithmType;
import com.altvil.enumerations.OptimizationType;
import com.altvil.netop.service.AroConversionService;

@RestController
public class NewOptimizeEndPoint {

	@Autowired
	private AroConversionService aroConversionService;

	@Autowired
	private SchedulerService schedulerService;

	@Autowired
	private RootOptimizationService rootOptimizationService;

	@RequestMapping(value = "/optimize/masterplan", method = RequestMethod.POST)
	public @ResponseBody AroRootPlanJobResponse postRecalcMasterPlan(
			@RequestBody AroOptimizationPlan aroRequest)
			throws InterruptedException, ExecutionException, NoSuchStrategy {

		Future<OptimizedRootPlan> future = schedulerService.submit(() -> rootOptimizationService
				.optimize(toOptimizationPlan(aroRequest)));

		OptimizedRootPlan rootPlan = future.get() ;
		rootPlan.getPlanAnalysisReport() ;		

		AroRootPlanJobResponse mpr = new AroRootPlanJobResponse();
		mpr.setPlanAnalysisReport(aroConversionService
				.toAroPlanAnalysisReport(rootPlan.getPlanAnalysisReport()));
		return mpr;

	}

	private OptimizationConstraints toOptimizationConstraints(
			AroOptimizationPlan plan) {

		FinancialConstraints financials = plan.getFinancialConstraints();
		if (financials == null) {
			financials = new FinancialConstraints();
		}

		switch (plan.getAlgorithm()) {

		case IRR:
			return new IrrConstraints(plan.getAlgorithm(),
					financials.getYears(), financials.getDiscountRate(),
					plan.getThreshold() == null ? Double.NaN : plan
							.getThreshold(), financials.getBudget());

		case COVERAGE:
			return new CoverageConstraints(financials.getYears(),
					financials.getDiscountRate(),
					plan.getThreshold() == null ? Double.NaN : plan
							.getThreshold(), financials.getBudget());

		case NPV:

		case PRUNNING_NPV:
			return new NpvConstraints(plan.getAlgorithm(),
					financials.getYears(), financials.getDiscountRate(),
					plan.getThreshold() == null ? Double.NaN : plan
							.getThreshold(), financials.getBudget());

		case CAPEX:
			return new CapexConstraints(OptimizationType.CAPEX,
					financials.getYears(), financials.getDiscountRate(),
					Double.NaN, financials.getBudget());

		case UNCONSTRAINED:
		default:
			return new DefaultConstraints(OptimizationType.UNCONSTRAINED);

		}

	}

	private AlgorithmType inferAlgorithmType(AroOptimizationPlan plan) {

		if (plan.getAlgorithmType() != AlgorithmType.DEFAULT) {
			return plan.getAlgorithmType();
		}

		if (plan.getAlgorithm() == null) {
			return AlgorithmType.PLANNING;
		}

		switch (plan.getAlgorithm()) {
		case PRUNNING_NPV:
		case NPV:
			return AlgorithmType.EXPANDED_ROUTING;
		case COVERAGE:
		case IRR:
			return AlgorithmType.PRUNING;
		case CAPEX:
		case UNCONSTRAINED:
		default:
			return AlgorithmType.PLANNING;
		}
	}

	private RootOptimizationRequest toOptimizationPlan(AroOptimizationPlan plan) {

		Set<LocationEntityType> entityTypes = toMask(plan.getLocationTypes());

		return RootOptimizationRequest
				.build()
				.setAlgorithmType(inferAlgorithmType(plan))
				.setAnalysisSelectionMode(plan.getAnalysisSelectionMode())
				.setProcessingLayers(plan.getProcessLayers())
				.setUsePlanConduit(plan.isUsePlanConduit())
				.setOptimizationConstraints(toOptimizationConstraints(plan))
				.setMrc(entityTypes.contains(AroLocationEntityType.mrcgte2000) ? 2000 : 0)
				.setPlanId(plan.getPlanId())
				.setFiberNetworkConstraints(plan.getFiberNetworkConstraints())
				.setLocationEntities(toMask(plan.getLocationTypes()))
				.setOptimizationMode(plan.getOptimizationMode()).build();
	}

	private Set<LocationEntityType> toEntityTypes(
			Collection<AroLocationEntityType> mask) {
		if (mask == null) {
			return null;
		}

		return mask.stream().flatMap(c -> c.getMappedTypes().stream())
				.collect(Collectors.toSet());
	}

	private Set<LocationEntityType> toMask(
			Collection<AroLocationEntityType> mask) {
		return LocationTypeMask.MASK.toMask(toEntityTypes(mask));
	}

}
