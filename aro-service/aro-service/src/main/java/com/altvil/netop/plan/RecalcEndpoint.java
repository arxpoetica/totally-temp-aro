package com.altvil.netop.plan;

import java.security.Principal;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.netop.network.algorithms.NpvSetupRequest;
import com.altvil.netop.network.algorithms.ScalarSetupRequest;

@RestController
public class RecalcEndpoint {
	private ExecutorService executorService;

	@Autowired
	private JobService jobService;
	
	@Autowired
	private NetworkPlanningService networkPlanningService;

	// Temporary - replace with injected service.
	@PostConstruct
	public void init() {
		executorService = Executors.newFixedThreadPool(2);
	}

	@RequestMapping(value = "/recalc/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(Principal requestor, @RequestBody FiberPlanRequest request) {
		// KJG Convert FiberPlanRequest to contain a NetworkStrategyRequest
		
		NetworkStrategyRequest nsr = null;
		switch(request.getAlgorithm()) {
		case NPV:
			final NpvSetupRequest npvSetupRequest = new NpvSetupRequest();
			npvSetupRequest.setDiscountRate(request.getDiscountRate());
			npvSetupRequest.setYears(request.getPeriods());
			nsr = npvSetupRequest;
			break;
		case WEIGHT_MINIMIZATION:
			final ScalarSetupRequest ssr = new ScalarSetupRequest();
			nsr = ssr;
		}
		
		MasterPlanBuilder mpc = networkPlanningService.planMasterFiber(requestor, request.getPlanId(), request.getNetworkConfiguration(), request.getFiberNetworkConstraints());

		Job<MasterPlanUpdate> job = jobService.submit(mpc);
		
		//Block until complete (Temporary until the UI can handle async responses)
		try {
			job.get();
		} catch (InterruptedException | ExecutionException e) {
			e.printStackTrace();
		}

		MasterPlanJobResponse mpr = new MasterPlanJobResponse();
		mpr.setJob(job);
		mpr.setWireCenterids(mpc.getWireCenterPlans());

		return mpr;
	}

	@RequestMapping(value = "/recalc/wirecenter", method = RequestMethod.POST)
	public @ResponseBody Job<FiberPlanResponse> postRecalc(Principal username,
			@RequestBody FiberPlanRequest fiberPlanRequest)
			throws InterruptedException, ExecutionException {

		Job<FiberPlanResponse> job = jobService
				.submit(new JobService.Builder<FiberPlanResponse>(username).setCallable(() -> {

					FiberNetworkConstraints constraints = fiberPlanRequest
							.getFiberNetworkConstraints() == null ? new FiberNetworkConstraints()
							: fiberPlanRequest.getFiberNetworkConstraints();

					Future<WirecenterNetworkPlan> future = networkPlanningService
							.planFiber(fiberPlanRequest.getPlanId(), fiberPlanRequest.getNetworkConfiguration(),
									constraints);

					WirecenterNetworkPlan plan = future.get();

					FiberPlanResponse response = new FiberPlanResponse();

					response.setFiberPlanRequest(fiberPlanRequest);
					response.setNewEquipmentCount(plan.getNetworkNodes().size());

					return response;
				}).setExecutorService(executorService));
		
		return job;
	}
}
