package com.altvil.aro.service.optimization.custom;

import com.altvil.aro.service.optimization.wirecenter.WireCenterOptimizationStrategy;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;

public interface CustomOptimizationService {
	public WireCenterOptimizationStrategy create(
			WirecenterOptimizationRequest request);
}
