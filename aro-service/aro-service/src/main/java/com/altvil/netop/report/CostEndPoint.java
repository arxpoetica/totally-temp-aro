package com.altvil.netop.report;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.cost.CostService;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.netop.plan.MasterPlanJobResponse;

@RestController
public class CostEndPoint {
	
	private CostService costService ;
	
	@RequestMapping(value = "/report/plan/{id}/equipment_summary", method = RequestMethod.GET)
	public @ResponseBody MasterPlanJobResponse getEquipmentSummary(
			@PathVariable("id") long planId)
			throws NoSuchStrategy, InterruptedException {
		return null;
	}

	@RequestMapping(value = "/report/plan/{id}/fiber_summary", method = RequestMethod.GET)
	public @ResponseBody MasterPlanJobResponse getFiberSummary(
			@PathVariable("id") long planId)
			throws NoSuchStrategy, InterruptedException {
		return null;
	}

}
