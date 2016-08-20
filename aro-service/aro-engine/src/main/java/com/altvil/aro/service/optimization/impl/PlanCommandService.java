package com.altvil.aro.service.optimization.impl;

import java.util.Collection;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.ProcessLayerCommand;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.report.GeneratedPlan;


//
// This acts as a facade and will be later turned into Explicit commands and composed
//
public interface PlanCommandService {

	void deleteOldPlans(long planId);

	Collection<ProcessLayerCommand> createLayerCommands(
			MasterOptimizationRequest request);

	GeneratedPlan reifyPlan(OptimizationConstraints constraints, PlannedNetwork plan) ;
	OptimizedPlan summarize(GeneratedPlan plan) ;
	void save(OptimizedPlan plan) ;
	OptimizedPlan reifyPlanSummarizeAndSave(OptimizationConstraints constraints, PlannedNetwork plan) ;
	

}