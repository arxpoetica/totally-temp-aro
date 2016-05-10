package com.altvil.netop.plan;

import java.security.Principal;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
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
import com.altvil.aro.service.plan.InputRequests;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

@RestController
public class RecalcEndpoint {

	private static final Logger log = LoggerFactory
			.getLogger(RecalcEndpoint.class.getName());
	
	private Ignite igniteGrid;

	@Autowired
	private JobService jobService;
	
	@Autowired
	private NetworkPlanningService networkPlanningService;
	
	@Autowired  //NOTE the method name determines the name/alias of Ignite grid which gets bound!
	private void setRecalcEndpointIgniteGrid(Ignite igniteBean)
	{
		this.igniteGrid = igniteBean;
	}	
	
	// Temporary - replace with injected service.
	@PostConstruct
	public void init() {
	}
	
	@RequestMapping(value = "/recalc/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanJobResponse postRecalcMasterPlan(Principal requestor, @RequestBody FiberPlanRequest request) {
		MasterPlanBuilder mpc = networkPlanningService.planMasterFiber(requestor, request.getPlanId(), new InputRequests(), request.getFiberNetworkConstraints());

		Job<MasterPlanUpdate> job = jobService.submit(mpc);
		
		//Block until complete (Temporary until the UI can handle async responses)
		try {
			job.get();
		} catch (InterruptedException | ExecutionException e) {
			log.error("Error retrieving job value. ", e);;
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
				.submit(new JobRequestIgniteCallable<FiberPlanResponse>(username, igniteGrid.compute(), () -> {

					FiberNetworkConstraints constraints = fiberPlanRequest
							.getFiberNetworkConstraints() == null ? new FiberNetworkConstraints()
							: fiberPlanRequest.getFiberNetworkConstraints();

					Future<WirecenterNetworkPlan> future = networkPlanningService
							.planFiber(fiberPlanRequest.getPlanId(),
									constraints);

					WirecenterNetworkPlan plan = future.get();

					FiberPlanResponse response = new FiberPlanResponse();

					response.setFiberPlanRequest(fiberPlanRequest);
					response.setNewEquipmentCount(plan.getNetworkNodes().size());

					return response;
				}));
		
		return job;
	}
}
