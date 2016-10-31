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
import com.altvil.aro.service.optimization.root.OptimizedRootPlan;
import com.altvil.aro.service.optimization.root.RootOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.RootOptimizationRequest;
import com.altvil.aro.service.property.SystemPropertyService;
import com.altvil.aro.service.scheduler.SchedulerService;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.netop.BaseEndPointHandler;
import com.altvil.netop.service.AroConversionService;

@RestController
public class NewOptimizeEndPoint extends BaseEndPointHandler {

	@Autowired
	private AroConversionService aroConversionService;

	@Autowired
	private SchedulerService schedulerService;

	@Autowired
	private RootOptimizationService rootOptimizationService;
	
	@Autowired
	private SystemPropertyService systemPropertyService ;

	@RequestMapping(value = "/optimize/masterplan", method = RequestMethod.POST)
	public @ResponseBody AroRootPlanJobResponse postRecalcMasterPlan(
			@RequestBody AroOptimizationPlan aroRequest)
			throws InterruptedException, ExecutionException, NoSuchStrategy {
		return execute( () -> {
			Future<OptimizedRootPlan> future = schedulerService.submit(() -> rootOptimizationService
					.optimize(toOptimizationPlan(aroRequest)));

			OptimizedRootPlan rootPlan = future.get();
			rootPlan.getPlanAnalysisReport();

			AroRootPlanJobResponse mpr = new AroRootPlanJobResponse();
			mpr.setPlanAnalysisReport(aroConversionService
					.toAroPlanAnalysisReport(rootPlan.getPlanAnalysisReport()));
			return mpr;
		});
	}



	private RootOptimizationRequest toOptimizationPlan(AroOptimizationPlan plan) {

		Set<LocationEntityType> entityTypes = toMask(plan.getLocationTypes());

		return RootOptimizationRequest
				.build()
				.setOptimizationType(plan.getAlgorithm())
				.setAnalysisSelectionMode(plan.getAnalysisSelectionMode())
				.setProcessingLayers(plan.getProcessLayers())
				.setUsePlanConduit(plan.isUsePlanConduit())
				.setMrc(entityTypes.contains(AroLocationEntityType.mrcgte2000) ? 2000 : 0)
				.setAlgorithmType(plan.getAlgorithmType())
				.setPlanId(plan.getPlanId())
				.setFiberNetworkConstraints(plan.getFiberNetworkConstraints())
				.setLocationEntities(toMask(plan.getLocationTypes()))
				.setOptimizationMode(plan.getOptimizationMode())
				.setThreshold(plan.getThreshold())
				.setFinancialConstraints(plan.getFinancialConstraints())
				.setCustomOptimization(plan.getCustomOptimization())
				.build();
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
