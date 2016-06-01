package com.altvil.netop.plan;

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
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;
import com.altvil.netop.DummyRequester;

@RestController
public class RecalcEndpoint {

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

	@RequestMapping(value = "/recalc/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(@RequestBody FiberPlan request) throws NoSuchStrategy, InterruptedException {
		final FiberPlanConfigurationBuilder strategy = strategyService.getStrategy(FiberPlanConfigurationBuilder.class, request.getAlgorithm());
		FiberPlanConfiguration fiberPlan = strategy.build(request);
		FiberNetworkConstraints fiberNetworkConstraints = strategyService.getStrategy(FiberNetworkConstraintsBuilder.class, request.getAlgorithm()).build(request);
		MasterPlanBuilder mpc = networkPlanningService.planMasterFiber(DummyRequester.PRINCIPAL, fiberPlan, fiberNetworkConstraints);

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

	@RequestMapping(value = "/recalc/wirecenter", method = RequestMethod.POST)
	public @ResponseBody Job<FiberPlanResponse> postRecalc(
			@RequestBody AbstractFiberPlan request)
			throws InterruptedException, ExecutionException, NoSuchStrategy {		
		final FiberPlanConfiguration fiberPlan = strategyService.getStrategy(FiberPlanConfigurationBuilder.class, request.getAlgorithm()).build(request);
		final FiberNetworkConstraints fiberNetworkConstraints = strategyService.getStrategy(FiberNetworkConstraintsBuilder.class, request.getAlgorithm()).build(request);

		Job<FiberPlanResponse> job = jobService
				.submit(new JobRequestIgniteCallable<FiberPlanResponse>(DummyRequester.PRINCIPAL, igniteGrid.compute(), () -> {

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
}
