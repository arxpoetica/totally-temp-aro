package com.altvil.netop.plan;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.network.NetworkRequest;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.recalc.Job;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;

@RestController
public class RecalcEndpoint {

	@Autowired
	private RecalcService recalcService;

	@Autowired
	private PlanService planService;

	@Autowired
	private NetworkService networkService;

	@Autowired
	private SerializationService conversionService;

	@Autowired
	private NetworkPlanningService networkPlanningService;

	@RequestMapping(value = "/recalc/wirecenter", method = RequestMethod.POST)
	public @ResponseBody RecalcResponse<FiberPlanResponse> postRecalc(
			@RequestBody  FiberPlanRequest fiberPlanRequest) throws RecalcException,
			InterruptedException, ExecutionException {

		Job<FiberPlanResponse> job = recalcService
				.submit(() -> {

					FiberNetworkConstraints constraints = fiberPlanRequest
							.getFiberNetworkConstraints() == null ? new FiberNetworkConstraints()
							: fiberPlanRequest.getFiberNetworkConstraints();

					Optional<CompositeNetworkModel> model = planService.computeNetworkModel(
							networkService.getNetworkData(NetworkRequest
									.create(fiberPlanRequest.getPlanId())),
							constraints);

					WirecenterNetworkPlan plan = conversionService.convert(
							fiberPlanRequest.getPlanId(), model);

					networkPlanningService.save(plan);

					FiberPlanResponse response = new FiberPlanResponse();

					response.setFiberPlanRequest(fiberPlanRequest);
					response.setNewEquipmentCount(plan.getNetworkNodes().size());

					return response;
				});
		
		return job.getResponse() ;
	}
}
