package com.altvil.netop.roic;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.service.cost.CostService;
import com.altvil.aro.service.strategy.NoSuchStrategy;

@RestController
public class RoicEndPoint {

	@Autowired
	private CostService costService;

	@RequestMapping(value = "/reportxxxxx/plan/{id}/equipment_summary", method = RequestMethod.GET)
	public @ResponseBody List<EquipmentSummaryCost> getEquipmentSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {
		return costService.getEquipmentReport(planId);
	}

	@RequestMapping(value = "/reportxxxxx/plan/{id}/fiber_summary", method = RequestMethod.GET)
	public @ResponseBody List<FiberSummaryCost> getFiberSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {
		return costService.getFiberReport(planId);
	}

}
