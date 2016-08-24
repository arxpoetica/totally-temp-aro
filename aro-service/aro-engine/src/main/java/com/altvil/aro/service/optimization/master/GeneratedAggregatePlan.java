package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.report.SummarizedPlan;

public interface GeneratedAggregatePlan<R extends OptimizationRequest, P extends SummarizedPlan> {

	R getOptimizationRequest();

	Collection<P> getOptimizedPlans();

}
