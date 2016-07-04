package com.altvil.aro.service.optimization.wirecenter.impl;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;

public class DefaultOptimizationResult<T> implements WirecenterOptimization<T> {

	private WirecenterOptimizationRequest wirecenterOptimizationRequest;
	private T optimizedNetworks;
	private OptimizationException optimizationException;

	public DefaultOptimizationResult(
			WirecenterOptimizationRequest wirecenterOptimizationRequest,
			T optimizedNetworks) {
		super();
		this.wirecenterOptimizationRequest = wirecenterOptimizationRequest;
		this.optimizedNetworks = optimizedNetworks;
	}
	
	

	@Override
	public boolean isInError() {
		return this.optimizationException != null;
	}



	public DefaultOptimizationResult(
			WirecenterOptimizationRequest wirecenterOptimizationRequest,
			OptimizationException exception) {
		super();
		this.wirecenterOptimizationRequest = wirecenterOptimizationRequest;
		this.optimizationException = exception;
	}

	@Override
	public long getPlanId() {
		return wirecenterOptimizationRequest.getPlanId();
	}

	@Override
	public OptimizationException getOpitmizationException() {
		return optimizationException;
	}

	@Override
	public WirecenterOptimizationRequest getOptimizationRequest() {
		return wirecenterOptimizationRequest;
	}

	@Override
	public T getResult() {
		return optimizedNetworks;
	}

}
