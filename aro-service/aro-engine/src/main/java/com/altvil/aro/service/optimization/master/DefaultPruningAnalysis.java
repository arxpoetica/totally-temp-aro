package com.altvil.aro.service.optimization.master;

import java.util.Collection;
import java.util.Collections;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.OptimizationResult;

public class DefaultPruningAnalysis<T> implements MasterOptimizationResult<T> {

	private boolean cancelled;
	private Collection<OptimizationResult<T>> prunedNetworks;
	private Collection<OptimizationException> optimizationExceptions;

	public DefaultPruningAnalysis(boolean cancelled,
			Collection<OptimizationResult<T>> prunedNetworks,
			Collection<OptimizationException> optimizationExceptions) {
		super();
		this.cancelled = cancelled;
		this.prunedNetworks = prunedNetworks;
		this.optimizationExceptions = optimizationExceptions;
	}

	public DefaultPruningAnalysis(Collection<OptimizationResult<T>> result) {
		this(false, result, Collections.emptyList());
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.optimization.master.PruningAnalysis#isCancelled()
	 */
	@Override
	public boolean isCancelled() {
		return cancelled;
	}

	@Override
	public Collection<OptimizationResult<T>> getWirecenterOptimizations() {
		return prunedNetworks;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.aro.service.optimization.master.PruningAnalysis#
	 * getOptimizationExceptions()
	 */
	@Override
	public Collection<OptimizationException> getOptimizationExceptions() {
		return optimizationExceptions;
	}

}
