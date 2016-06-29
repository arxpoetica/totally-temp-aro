package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Collection;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public class DefaultPrunedNetwork implements PrunedNetwork {

	private WirecenterOptimizationRequest wirecenterOptimizationRequest;
	private Collection<OptimizedNetwork> optimizedNetworks;
	private OptimizationException optimizationException;

	public DefaultPrunedNetwork(
			WirecenterOptimizationRequest wirecenterOptimizationRequest,
			Collection<OptimizedNetwork> optimizedNetworks) {
		super();
		this.wirecenterOptimizationRequest = wirecenterOptimizationRequest;
		this.optimizedNetworks = optimizedNetworks;
	}

	public DefaultPrunedNetwork(
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
	public Collection<OptimizedNetwork> getOptimizedNetworks() {
		return optimizedNetworks;
	}

}
