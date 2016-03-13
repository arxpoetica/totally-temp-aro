package com.altvil.netop.plan;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.InputRequests;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.MasterPlanCalculation;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.recalc.Job;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

@RestController
public class RecalcEndpoint {

	@Autowired
	private PlanService planService;

	@Autowired
	private RecalcService recalcService;

	@Autowired
	private NetworkService networkService;

	@Autowired
	private SerializationService conversionService;

	@Autowired
	private NetworkPlanningService networkPlanningService;

	@RequestMapping(value = "/recalc/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanResponse postRecalcMasterPlan(
			@RequestBody FiberPlanRequest request) {

		MasterPlanCalculation mpc = networkPlanningService.planMasterFiber(
				request.getPlanId(), new InputRequests(), request.getFiberNetworkConstraints());

		Job<MasterPlanUpdate> job = recalcService.submit(() -> {
			MasterPlanUpdate mpu = mpc.getFuture().get();
			return mpu;

		});
		
		//Block Call
		job.getResponse() ;

		MasterPlanResponse mpr = new MasterPlanResponse();
		mpr.setRecalcJob(job.getJob());
		mpr.setWireCenterids(mpc.getWireCenterPlans());

		return mpr;
	}

	@RequestMapping(value = "/recalc/wirecenter", method = RequestMethod.POST)
	public @ResponseBody RecalcResponse<FiberPlanResponse> postRecalc(
			@RequestBody FiberPlanRequest fiberPlanRequest)
			throws RecalcException, InterruptedException, ExecutionException {

		Job<FiberPlanResponse> job = recalcService
				.submit(() -> {

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
				});
		

		return job.getResponse();
	}
}
