package com.altvil.aro.service.optimization.master;

import java.util.Collection;
import java.util.Collections;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;

public class DefaultMasterOptimizationResult<T> implements MasterOptimizationResult<T> {

	private boolean cancelled;
	private Collection<WirecenterOptimization<T>> prunedNetworks;
	private Collection<OptimizationException> optimizationExceptions;

	public DefaultMasterOptimizationResult(boolean cancelled,
			Collection<WirecenterOptimization<T>> prunedNetworks,
			Collection<OptimizationException> optimizationExceptions) {
		super();
		this.cancelled = cancelled;
		this.prunedNetworks = prunedNetworks;
		this.optimizationExceptions = optimizationExceptions;
	}

	public DefaultMasterOptimizationResult(Collection<WirecenterOptimization<T>> result) {
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
	public Collection<WirecenterOptimization<T>> getWirecenterOptimizations() {
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
