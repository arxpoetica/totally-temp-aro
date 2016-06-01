package com.altvil.netop.plan;

import java.security.Principal;
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

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.job.impl.JobRequestIgniteCallable;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.planning.FiberNetworkConstraintsBuilder;
import com.altvil.aro.service.planning.FiberPlan;
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
	
	@Autowired(required=false)  //NOTE the method name determines the name/alias of Ignite grid which gets bound!
	@IgniteInstanceResource
	private void setRecalcEndpointIgniteGrid(Ignite igniteBean)
	{
		this.igniteGrid = igniteBean;
	}	
	
	// Temporary - replace with injected service.
	@PostConstruct
	public void init() {
	}
	
	@Autowired
	private StrategyService strategyService;

	@RequestMapping(value = "/recalc/masterplan/p", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(Principal requestor, @RequestBody FiberPlan request) throws NoSuchStrategy, InterruptedException {
		final FiberPlanConfigurationBuilder strategy = strategyService.getStrategy(FiberPlanConfigurationBuilder.class, request.getAlgorithm());
		FiberPlanConfiguration fiberPlan = strategy.build(request);
		FtthThreshholds fiberNetworkConstraints = strategyService.getStrategy(FiberNetworkConstraintsBuilder.class, request.getAlgorithm()).build(request.getFiberNetworkConstraints());
		MasterPlanBuilder mpc = networkPlanningService.planMasterFiber(requestor, fiberPlan, fiberNetworkConstraints);

		Job<MasterPlanUpdate> job = jobService.submit(mpc);
		
		//Block until complete (Temporary until the UI can handle async responses)
		try {
			job.get();
		} catch (InterruptedException | ExecutionException e) {
			log.error("Error retrieving job value. ", e);;
		}

		MasterPlanJobResponse mpr = new MasterPlanJobResponse();
		mpr.setJob(job);
		// TODO Why are we storing WireCenter PLAN Ids in a property that expects WireCenter Ids????
		mpr.setWireCenterids(mpc.getWireCenterPlans().stream().map((p) ->{return p.getPlanId();}).collect(Collectors.toList()));

		return mpr;
	}

	@RequestMapping(value = "/recalc/wirecenter/p", method = RequestMethod.POST)
	public @ResponseBody Job<FiberPlanResponse> postRecalc(Principal username,
			@RequestBody FiberPlan request)
			throws InterruptedException, ExecutionException, NoSuchStrategy {		
		final FiberPlanConfiguration fiberPlan = strategyService.getStrategy(FiberPlanConfigurationBuilder.class, request.getAlgorithm()).build(request);
		final FtthThreshholds fiberNetworkConstraints = strategyService.getStrategy(FiberNetworkConstraintsBuilder.class, request.getAlgorithm()).build(request.getFiberNetworkConstraints());

		Job<FiberPlanResponse> job = jobService
				.submit(new JobRequestIgniteCallable<FiberPlanResponse>(username, igniteGrid.compute(), () -> {

					Future<WirecenterNetworkPlan> future = networkPlanningService
							.planFiber(fiberPlan, fiberNetworkConstraints);

					WirecenterNetworkPlan plan = future.get();

					FiberPlanResponse response = new FiberPlanResponse();

					response.setFiberPlanRequest(request);
					response.setNewEquipmentCount(plan.getNetworkNodes().size());

					return response;
				}));
		
		return job;
	}

	@RequestMapping(value = "/recalc/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(Principal requestor, @RequestBody AroFiberPlan aroRequest) throws NoSuchStrategy, InterruptedException {
		FiberPlan request = toFiberPlan(aroRequest);
		return postRecalcMasterPlan(requestor, request);
	}

	@RequestMapping(value = "/recalc/wirecenter", method = RequestMethod.POST)
	public @ResponseBody Job<FiberPlanResponse> postRecalc(Principal username,
			@RequestBody AroFiberPlan aroRequest)
			throws InterruptedException, ExecutionException, NoSuchStrategy {	
		FiberPlan request = toFiberPlan(aroRequest);
		return postRecalc(username, request);
	}
	
	private FiberPlan toFiberPlan(AroFiberPlan plan) {
		FiberPlanAlgorithm algorithm = plan.getAlgorithm();
		if (algorithm == null) {
			algorithm = FiberPlanAlgorithm.CAPEX;
		}
		
		algorithm = FiberPlanAlgorithm.NPV; // For demo
		
		switch (algorithm) {
		case NPV:
			{FinancialConstraints financials = plan.getFinancialConstraints();
			final NpvFiberPlanImpl npvFiberPlanImpl = new NpvFP();
			npvFiberPlanImpl.setPlanId(plan.getPlanId());
			npvFiberPlanImpl.setFiberNetworkConstraints(
					new FiberNetworkConstraints() /*
												   * plan.
												   * getFiberNetworkConstraints(
												   * )
												   */);
			if (financials == null) {
				npvFiberPlanImpl.setDiscountRate(0.2);
				npvFiberPlanImpl.setYear(2015);
				npvFiberPlanImpl.setYears(5);
			} else {
				npvFiberPlanImpl.setBudget(financials.getBudget());
				npvFiberPlanImpl.setDiscountRate(financials.getDiscountRate());
				npvFiberPlanImpl.setYears(financials.getYears());
			}
			return npvFiberPlanImpl;}
		case CAPEX:
		default:
			final CapexFiberPlanImpl capexFiberPlanImpl = new CapexFP();
			capexFiberPlanImpl.setPlanId(plan.getPlanId());
			capexFiberPlanImpl.setFiberNetworkConstraints(plan.getFiberNetworkConstraints());
			return capexFiberPlanImpl;
		}
	}
}
