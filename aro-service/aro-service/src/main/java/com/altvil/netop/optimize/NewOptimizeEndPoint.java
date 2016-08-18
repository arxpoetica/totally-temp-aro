package com.altvil.netop.optimize;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.demand.LocationTypeMask;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.constraints.CapexConstraints;
import com.altvil.aro.service.optimization.constraints.CoverageConstraints;
import com.altvil.aro.service.optimization.constraints.DefaultConstraints;
import com.altvil.aro.service.optimization.constraints.IrrConstraints;
import com.altvil.aro.service.optimization.constraints.NpvConstraints;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.spatial.AnalysisSelection;
import com.altvil.aro.service.optimization.spatial.SpatialAnalysisType;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.enumerations.OptimizationType;
import com.altvil.netop.plan.SelectedRegion;
import com.altvil.netop.service.AroConversionService;

@RestController
public class NewOptimizeEndPoint {

	@Autowired
	private AroConversionService aroConversionService;

	@Autowired @Qualifier("newOptimizationPlannerServiceImpl")
	private OptimizationPlannerService optimizationPlannerService;

	@RequestMapping(value = "/optimize/masterplan", method = RequestMethod.POST)
	public @ResponseBody AroMasterPlanJobResponse postRecalcMasterPlan(
			@RequestBody AroOptimizationPlan aroRequest)
			throws InterruptedException, ExecutionException, NoSuchStrategy {

		OptimizedMasterPlan response = optimizationPlannerService.optimize(
				toOptimizationPlan(aroRequest)).get();

		AroMasterPlanJobResponse mpr = new AroMasterPlanJobResponse();
		mpr.setPlanAnalysisReport(aroConversionService
				.toAroPlanAnalysisReport(response.getPlanAnalysisReport()));
		return mpr;

	}
	
	private Collection<AnalysisSelection> toSelectedWireCenters(
			Collection<SelectedRegion> selectedRegions) {

		List<AnalysisSelection> result = new ArrayList<>();

		if (selectedRegions != null) {
			for (SelectedRegion sr : selectedRegions) {
				switch (sr.getRegionType()) {
				case ANALYSIS_AREA :
					result.add(new AnalysisSelection(SpatialAnalysisType.ANALYSIS_AREA, Integer.parseInt(sr.getId())));
				case WIRECENTER:
					result.add(new AnalysisSelection(SpatialAnalysisType.WIRECENTER, Integer.parseInt(sr.getId())));
					break;
				default:
				}
			}
		}

		return result;

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

	private MasterOptimizationRequest toOptimizationPlan(
			AroOptimizationPlan plan) {

		return MasterOptimizationRequest
				.build()
				.setProcessingLayers(plan.getProcessLayers())
				.setOptimizationConstraints(toOptimizationConstraints(plan))
				.setPlanId(plan.getPlanId())
				.setFiberNetworkConstraints(plan.getFiberNetworkConstraints())
				.setLocationEntities(toMask(plan.getLocationTypes()))
				.setOptimizationMode(plan.getOptimizationMode())
				.setAnalysisSelections(toSelectedWireCenters(plan.getSelectedRegions()))
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
