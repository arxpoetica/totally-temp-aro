package com.altvil.aro.service.optimization.master.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.cost.CostService;
import com.altvil.aro.service.optimization.master.MasterOptimizationAnalysis;
import com.altvil.aro.service.optimization.master.MasterOptimizationPlan;
import com.altvil.aro.service.optimization.master.MasterPlanningService;

@Service
public class MasterPlanningServiceImpl implements MasterPlanningService {

	private CostService costService;

	@Autowired
	public MasterPlanningServiceImpl(CostService costService) {
		super();
		this.costService = costService;
	}

	//TODO Add any extra information required
	
	@Override
	public MasterOptimizationAnalysis save(MasterOptimizationPlan plan) {
		costService.updateMasterPlanCosts(plan);
		return new MasterOptimizationAnalysis(plan);
	}

}
