package com.altvil.aro.service.optimization.factory;

import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;

public interface PlanningOptimizationFactory {
	
	public WireCenterPlanningStrategy create(
			WirecenterOptimizationRequest request);

}
