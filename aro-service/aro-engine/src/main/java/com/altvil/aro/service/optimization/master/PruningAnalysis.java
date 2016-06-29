package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;

public class PruningAnalysis {

	private boolean cancelled;
	private Collection<PrunedNetwork> prunedNetworks;
	private Collection<OptimizationException> optimizationExceptions;
	

	public PruningAnalysis(boolean cancelled,
			Collection<PrunedNetwork> prunedNetworks,
			Collection<OptimizationException> optimizationExceptions) {
		super();
		this.cancelled = cancelled;
		this.prunedNetworks = prunedNetworks;
		this.optimizationExceptions = optimizationExceptions;
	}

	public boolean isCancelled() {
		return cancelled;
	}

	public Collection<PrunedNetwork> getPrunedNetworks() {
		return prunedNetworks;
	}

	public Collection<OptimizationException> getOptimizationExceptions() {
		return optimizationExceptions;
	}

}
