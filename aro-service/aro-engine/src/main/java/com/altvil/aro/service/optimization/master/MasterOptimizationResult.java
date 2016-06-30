package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.OptimizationResult;

public interface MasterOptimizationResult<T> {

	boolean isCancelled();

	Collection<OptimizationResult<T>> getWirecenterOptimizations();

	Collection<OptimizationException> getOptimizationExceptions();

}
