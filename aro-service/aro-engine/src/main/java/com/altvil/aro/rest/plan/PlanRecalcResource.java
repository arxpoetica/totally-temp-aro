package com.altvil.aro.rest.plan;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.apache.poi.ss.formula.functions.T;
import org.springframework.beans.factory.annotation.Autowired;

import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

@Path("recalc")
public class PlanRecalcResource {

	@Autowired
	private RecalcService recalcService;

	@Autowired
	private PlanService planService;

	@Autowired
	private NetworkService networkService;

	@POST
	@Path("plan")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public RecalcResponse postRecalc(FiberPlanRequest fiberPlanRequest)
			throws RecalcException, InterruptedException, ExecutionException {

		planService.computeNetworkModel(
				networkService.getNetworkData(fiberPlanRequest.getPlanId()),
				fiberPlanRequest.getFiberNetworkConstraints());

//		recalcService.submit(new Callable<T>() {
//		});
//
//		return MainEntry.service(RecalcService.class).submit(request)
//				.getResponse();
		
		
		return null ;
	}

}
