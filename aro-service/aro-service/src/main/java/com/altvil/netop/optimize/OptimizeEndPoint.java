package com.altvil.netop.optimize;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.job.JobService.JobRequest;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.planning.FiberNetworkConstraintsBuilder;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfigurationBuilder;
import com.altvil.aro.service.planning.optimization.impl.CapexOptimizationPlanImpl;
import com.altvil.aro.service.planning.optimization.impl.CoverageOptimizationPlanImpl;
import com.altvil.aro.service.planning.optimization.impl.NpvOptimizationPlanImpl;
import com.altvil.aro.service.planning.optimization.strategies.OptimizationPlanConfiguration;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;
import com.altvil.netop.plan.MasterPlanJobResponse;

@RestController
public class OptimizeEndPoint {

	@Autowired
	private PlanService			   planService;

	@Autowired
	private JobService			   jobService;

	@Autowired
	private NetworkService		   networkService;

	@Autowired
	private SerializationService   conversionService;

	@Autowired
	private NetworkPlanningService networkPlanningService;

	@RequestMapping(value = "/optimize/wirecenter", method = RequestMethod.POST)
	public @ResponseBody WirecenterUpdate postRecalcWirecenterPlan(Principal requestor,
			@RequestBody AroOptimizationPlan aroRequest)
			throws InterruptedException, ExecutionException, NoSuchStrategy {
		// Start async task
		com.altvil.aro.service.job.Job<WirecenterNetworkPlan> job = beginRecalcWirecenterPlan(requestor, aroRequest);
		// Get task result
		return completeRecalcWirecenterPlan(job.getId());
	}

	@RequestMapping(value = "/optimize/wirecenter/start", method = RequestMethod.POST)
	public @ResponseBody com.altvil.aro.service.job.Job<WirecenterNetworkPlan> beginRecalcWirecenterPlan(
			Principal requestor, @RequestBody AroOptimizationPlan aroRequest) throws NoSuchStrategy {

		OptimizationPlan request = toOptimizationPlan(aroRequest);

		OptimizationPlanConfiguration fiberPlan = strategyService
				.getStrategy(OptimizationPlanConfigurationBuilder.class, request.getOptimizationType()).build(request);
		FtthThreshholds fiberNetworkConstraints = strategyService
				.getStrategy(FiberNetworkConstraintsBuilder.class, request.getOptimizationType())
				.build(request.getFiberNetworkConstraints());

		JobRequest<WirecenterNetworkPlan> networkPlanRequest = networkPlanningService.optimizeWirecenter(requestor,
				fiberPlan, fiberNetworkConstraints);

		Map<String, Object> metaIds = new HashMap<String, Object>();
		metaIds.put("planId", fiberPlan.getPlanId());
		networkPlanRequest.setMetaIdentifiers(metaIds);

		return jobService.submit(networkPlanRequest);
	}

	@RequestMapping(value = "/optimize/wirecenter/results", method = RequestMethod.POST)
	public @ResponseBody WirecenterUpdate completeRecalcWirecenterPlan(
			@RequestBody com.altvil.aro.service.job.Job.Id request) throws InterruptedException, ExecutionException {
		Job<WirecenterNetworkPlan> f = jobService.get(request);
		WirecenterNetworkPlan wnp = f.get();

		WirecenterUpdate wu = new WirecenterUpdate();
		wu.setWirecenterId(wnp.getPlanId());
		return wu;
	}

	@RequestMapping(value = "/optimize/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(Principal requestor,
			@RequestBody AroOptimizationPlan request) throws InterruptedException, ExecutionException, NoSuchStrategy {

		// Start the async job
		MasterPlanJobResponse masterPlanResponse = beginRecalcMasterPlan(requestor, request);
		// Get job results
		return completeRecalcMasterPlan(masterPlanResponse.getJob().getId());
	}

	@Autowired
	private StrategyService strategyService;

	@RequestMapping(value = "/optimize/masterplan/start", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse beginRecalcMasterPlan(Principal requestor,
			@RequestBody AroOptimizationPlan aroRequest) throws NoSuchStrategy, InterruptedException {
		OptimizationPlan request = toOptimizationPlan(aroRequest);

		OptimizationPlanConfiguration optimizationPlanConfiguration = strategyService
				.getStrategy(OptimizationPlanConfigurationBuilder.class, request.getOptimizationType()).build(request);
		FtthThreshholds fiberNetworkConstraints = strategyService
				.getStrategy(FiberNetworkConstraintsBuilder.class, request.getOptimizationType())
				.build(aroRequest.getFiberNetworkConstraints());

		MasterPlanBuilder mpc = networkPlanningService.optimizeMasterFiber(requestor, optimizationPlanConfiguration,
				fiberNetworkConstraints);

		com.altvil.aro.service.job.Job<MasterPlanUpdate> job = jobService.submit(mpc);

		MasterPlanJobResponse mpr = new MasterPlanJobResponse();
		mpr.setJob(job);
		// TODO Check this. Why are plan Ids being assigned to something that
		// appears to expect wirecenter Ids?
		mpr.setWireCenterids(mpc.getWireCenterPlans().stream().mapToLong(p -> {
			return p.getPlanId();
		}).boxed().collect(Collectors.toList()));

		return mpr;
	}

	@RequestMapping(value = "/optimize/masterplan/results", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse completeRecalcMasterPlan(
			@RequestBody com.altvil.aro.service.job.Job.Id request) throws InterruptedException, ExecutionException {
		com.altvil.aro.service.job.Job<MasterPlanUpdate> job = jobService.get(request);
		MasterPlanUpdate wnp = job.get();

		List<Long> planIds = wnp.getUpdates().stream().map((update) -> update.getPlanId()).collect(Collectors.toList());

		MasterPlanJobResponse mpr = new MasterPlanJobResponse();
		mpr.setJob(job);
		mpr.setWireCenterids(planIds);

		return mpr;
	}

	private OptimizationPlan toOptimizationPlan(AroOptimizationPlan plan) {

		switch (plan.getOptimizationType()) {
		case NPV:
			FinancialConstraints financials = plan.getFinancialConstraints();
			final NpvOptimizationPlanImpl npvOptimizationPlanImpl = new NpvOptimizationPlanImpl(financials.getBudget(),
					financials.getDiscountRate(), financials.getYears());
			npvOptimizationPlanImpl.setPlanId(plan.getPlanId());
			return npvOptimizationPlanImpl;
		case COVERAGE:
			final CoverageOptimizationPlanImpl coverageOptimizationPlanImpl = new CoverageOptimizationPlanImpl(
					plan.getCoverage());
			coverageOptimizationPlanImpl.setPlanId(plan.getPlanId());
			return coverageOptimizationPlanImpl;

		case CAPEX:
		case PENETRATION:
		case IRR:
		default:
			return new CapexOptimizationPlanImpl();
		}

	}
}
