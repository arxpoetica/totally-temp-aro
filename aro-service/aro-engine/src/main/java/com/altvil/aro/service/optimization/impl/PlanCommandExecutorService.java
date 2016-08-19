package com.altvil.aro.service.optimization.impl;

import java.util.Collection;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.impl.type.ProcessLayerCommand;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;

public interface PlanCommandExecutorService {

	void deleteOldPlans(long planId);

	Collection<ProcessLayerCommand> createLayerCommands(
			MasterOptimizationRequest request);

	OptimizedPlan reify(OptimizationConstraints constraints, PlannedNetwork plan);

}