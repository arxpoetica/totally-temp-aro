package com.altvil.netop.optimize;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
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
import com.altvil.aro.service.optimization.constraints.IrrConstraints;
import com.altvil.aro.service.optimization.constraints.NpvConstraints;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationResponse;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;
import com.altvil.enumerations.OptimizationType;
import com.altvil.netop.plan.MasterPlanJobResponse;
import com.altvil.netop.plan.SelectedRegion;

@RestController
public class NewOptimizeEndPoint {

	@Autowired
	private OptimizationPlannerService optimizationPlannerService;

	@RequestMapping(value = "/optimize/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(
			@RequestBody AroOptimizationPlan aroRequest)
			throws InterruptedException, ExecutionException, NoSuchStrategy {

		MasterOptimizationResponse response = optimizationPlannerService
				.optimize(toOptimizationPlan(aroRequest)).get();

		MasterPlanJobResponse mpr = new MasterPlanJobResponse();
		mpr.setWireCenterids(response.getUpdates().stream()
				.map((update) -> update.getPlanId())
				.collect(Collectors.toList()));
		return mpr;

	}

	@Autowired
	private StrategyService strategyService;

	private Set<Integer> toSelectedWireCenters(
			Collection<SelectedRegion> selectedRegions) {

		Set<Integer> result = new HashSet<>();

		if (selectedRegions != null) {
			for (SelectedRegion sr : selectedRegions) {
				switch (sr.getRegionType()) {
				case WIRECENTER:
					result.add(Integer.parseInt(sr.getId()));
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

		switch (plan.getAlgorithm()) {

		case IRR:
		case MAX_IRR:
		case BUDGET_IRR:
		case TARGET_IRR:
			return new IrrConstraints(plan.getAlgorithm(),
					financials.getYears(), financials.getDiscountRate(),
					plan.getThreshold() == null ? Double.NaN : plan
							.getThreshold(), financials.getBudget());

		case COVERAGE:
			return new CoverageConstraints(financials.getYears(),
					financials.getDiscountRate(),
					plan.getThreshold() == null ? Double.NaN : plan
							.getThreshold(), financials.getBudget());

		case PRUNNING_NPV:
			return new NpvConstraints(OptimizationType.PRUNNING_NPV,
					financials.getYears(), financials.getDiscountRate(),
					plan.getThreshold() == null ? Double.NaN : plan
							.getThreshold(), financials.getBudget());

		case CAPEX:
		default:
			return new CapexConstraints(OptimizationType.CAPEX,
					financials.getYears(), financials.getDiscountRate(),
					Double.NaN, financials.getBudget());

		}

	}

	private MasterOptimizationRequest toOptimizationPlan(
			AroOptimizationPlan plan) {

		return MasterOptimizationRequest
				.build()
				.setOptimizationConstraints(toOptimizationConstraints(plan))
				.setPlanId(plan.getPlanId())
				.setFiberNetworkConstraints(plan.getFiberNetworkConstraints())
				.setLocationEntities(toMask(plan.getLocationTypes()))
				.setWirecenters(
						toSelectedWireCenters(plan.getSelectedRegions()))
				.build();

	}

	private Set<LocationEntityType> toMask(Collection<LocationEntityType> mask) {
		return LocationTypeMask.MASK.toMask(mask);
	}

}
