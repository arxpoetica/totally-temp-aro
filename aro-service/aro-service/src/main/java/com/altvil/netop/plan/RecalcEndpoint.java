package com.altvil.netop.plan;

import java.security.Principal;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.apache.ignite.resources.IgniteInstanceResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.demand.LocationTypeMask;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.job.impl.JobRequestIgniteCallable;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.planning.FiberNetworkConstraintsBuilder;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.GlobalConstraintBuilder;
import com.altvil.aro.service.planning.fiber.FiberPlanConfigurationBuilder;
import com.altvil.aro.service.planning.fiber.impl.CapexFiberPlanImpl;
import com.altvil.aro.service.planning.fiber.impl.NpvFiberPlanImpl;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.altvil.netop.optimize.FinancialConstraints;

@RestController
public class RecalcEndpoint {

	public static class CapexFP extends CapexFiberPlanImpl {
	}

	public static class NpvFP extends NpvFiberPlanImpl {
	}

	private static final Logger log = LoggerFactory
			.getLogger(RecalcEndpoint.class.getName());

	private Ignite igniteGrid;

	@Autowired
	private JobService jobService;

	@Autowired
	private NetworkPlanningService networkPlanningService;

	@Autowired(required = false)
	// NOTE the method name determines the name/alias of Ignite grid which gets
	// bound!
	@IgniteInstanceResource
	private void setRecalcEndpointIgniteGrid(Ignite igniteBean) {
		this.igniteGrid = igniteBean;
	}

	// Temporary - replace with injected service.
	@PostConstruct
	public void init() {
	}

	@Autowired
	private StrategyService strategyService;

	@RequestMapping(value = "/recalc/masterplan/p", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(
			Principal requestor, @RequestBody FiberPlan request)
			throws NoSuchStrategy, InterruptedException {
		final FiberPlanConfigurationBuilder strategy = strategyService
				.getStrategy(FiberPlanConfigurationBuilder.class,
						request.getAlgorithm());
		FiberPlanConfiguration fiberPlan = strategy.build(request);
		FtthThreshholds fiberNetworkConstraints = strategyService.getStrategy(
				FiberNetworkConstraintsBuilder.class, request.getAlgorithm())
				.build(request.getFiberNetworkConstraints());
		GlobalConstraint globalConstraint = strategyService.getStrategy(
				GlobalConstraintBuilder.class, request.getAlgorithm()).build(
				request);

		MasterPlanBuilder mpc = networkPlanningService
				.planMasterFiber(requestor, fiberPlan, fiberNetworkConstraints,
						globalConstraint);

		Job<MasterPlanUpdate> job = jobService.submit(mpc);

		// Block until complete (Temporary until the UI can handle async
		// responses)
		try {
			job.get();
		} catch (InterruptedException | ExecutionException e) {
			log.error("Error retrieving job value. ", e);
			;
		}

		MasterPlanJobResponse mpr = new MasterPlanJobResponse();
		mpr.setJob(job);
		// TODO Why are we storing WireCenter PLAN Ids in a property that
		// expects WireCenter Ids????
		mpr.setWireCenterids(mpc.getWireCenterPlans().stream().map((p) -> {
			return p.getPlanId();
		}).collect(Collectors.toList()));

		return mpr;
	}

	@RequestMapping(value = "/recalc/wirecenter/p", method = RequestMethod.POST)
	public @ResponseBody Job<FiberPlanResponse> postRecalc(Principal username,
			@RequestBody FiberPlan request) throws InterruptedException,
			ExecutionException, NoSuchStrategy {
		final FiberPlanConfiguration fiberPlan = strategyService.getStrategy(
				FiberPlanConfigurationBuilder.class, request.getAlgorithm())
				.build(request);
		final FtthThreshholds fiberNetworkConstraints = strategyService
				.getStrategy(FiberNetworkConstraintsBuilder.class,
						request.getAlgorithm()).build(
						request.getFiberNetworkConstraints());
		GlobalConstraint globalConstraint = strategyService.getStrategy(
				GlobalConstraintBuilder.class, request.getAlgorithm()).build(
				request);

		Job<FiberPlanResponse> job = jobService
				.submit(new JobRequestIgniteCallable<FiberPlanResponse>(
						username,
						igniteGrid.compute(),
						() -> {

							Future<WirecenterNetworkPlan> future = networkPlanningService
									.planFiber(fiberPlan,
											fiberNetworkConstraints,
											globalConstraint);

							WirecenterNetworkPlan plan = future.get();

							FiberPlanResponse response = new FiberPlanResponse();

							response.setFiberPlanRequest(request);
							response.setNewEquipmentCount(plan
									.getNetworkNodes().size());

							return response;
						}));

		return job;
	}

	@RequestMapping(value = "/recalc/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(
			Principal requestor, @RequestBody AroFiberPlan aroRequest)
			throws NoSuchStrategy, InterruptedException {
		FiberPlan request = toFiberPlan(aroRequest);
		return postRecalcMasterPlan(requestor, request);
	}

	@RequestMapping(value = "/recalc/wirecenter", method = RequestMethod.POST)
	public @ResponseBody Job<FiberPlanResponse> postRecalc(Principal username,
			@RequestBody AroFiberPlan aroRequest) throws InterruptedException,
			ExecutionException, NoSuchStrategy {
		FiberPlan request = toFiberPlan(aroRequest);
		return postRecalc(username, request);
	}

	private Set<LocationEntityType> toMask(Collection<LocationEntityType> mask) {
		return LocationTypeMask.MASK.toMask(mask);
	}

	private Set<Integer> toSelectedWireCenters(
			Collection<SelectedRegion> selectedRegions) {

		Set<Integer> result = new HashSet<>();

		if (selectedRegions != null) {
			for (SelectedRegion sr : selectedRegions) {
				switch (sr.getRegionType()) {
				case WIRE_CENTER:
					result.add(Integer.parseInt(sr.getId()));
					break;
				default:
				}
			}
		}

		return result;

	}

	private FiberPlan toFiberPlan(AroFiberPlan plan) {
		FiberPlanAlgorithm algorithm = plan.getAlgorithm();
		if (algorithm == null) {
			algorithm = FiberPlanAlgorithm.CAPEX;
		}

		switch (algorithm) {
		case NPV: {
			FinancialConstraints financials = plan.getFinancialConstraints();
			final NpvFiberPlanImpl npvFiberPlan = new NpvFP();
			npvFiberPlan.setPlanId(plan.getPlanId());
			npvFiberPlan
					.setFiberNetworkConstraints(new FiberNetworkConstraints() /*
																					   */);
			npvFiberPlan.setBudget(financials.getBudget());
			npvFiberPlan.setDiscountRate(financials.getDiscountRate());
			npvFiberPlan.setYears(financials.getYears());
			npvFiberPlan
					.setLocationEntityTypes(toMask(plan.getLocationTypes()));
			return npvFiberPlan;
		}
		case CAPEX:
		default:
			final CapexFiberPlanImpl capexFiberPlan = new CapexFP();
			capexFiberPlan.setPlanId(plan.getPlanId());
			capexFiberPlan.setFiberNetworkConstraints(plan
					.getFiberNetworkConstraints());
			capexFiberPlan.setLocationEntityTypes(toMask(plan
					.getLocationTypes()));
			capexFiberPlan.setSelectedWireCenters(toSelectedWireCenters(plan.getSelectedRegions())) ;
			
			return capexFiberPlan;
		}
	}
}
