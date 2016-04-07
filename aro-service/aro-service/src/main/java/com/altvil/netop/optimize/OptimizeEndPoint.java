package com.altvil.netop.optimize;

import java.util.concurrent.Future;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.plan.InputRequests;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.MasterPlanCalculation;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.aro.service.planing.OptimizationType;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.recalc.Job;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.netop.plan.MasterPlanResponse;

@RestController
public class OptimizeEndPoint {
	
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

	
	@RequestMapping(value = "/optimize/wirecenter", method = RequestMethod.POST)
	public @ResponseBody WirecenterUpdate postRecalcWirecenterPlan(
			@RequestBody OptimizationPlanRequest request) {

		OptimizationInputs optimizationInputs = (request.getOptimizationInputs() == null ? new OptimizationInputs(OptimizationType.COVERAGE, 0.5) : request.getOptimizationInputs()) ;
		
		Future<WirecenterNetworkPlan> f = networkPlanningService.optimizeWirecenter(
				request.getPlanId(), new InputRequests(),  optimizationInputs, request.getFiberNetworkConstraints());

		Job<WirecenterUpdate> job = recalcService.submit(() -> {
			f.get() ;
			WirecenterUpdate wu = new WirecenterUpdate() ;
			wu.setWirecenterId(request.getPlanId());
			return wu ;
		});
		
		//Block Call
		return job.getResponse().getResult() ;

		
	}


	
	@RequestMapping(value = "/optimize/masterplan", method = RequestMethod.POST)
	public @ResponseBody MasterPlanResponse postRecalcMasterPlan(
			@RequestBody OptimizationPlanRequest request) {

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

	

}
