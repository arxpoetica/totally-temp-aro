package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;

public interface MasterOptimizationResult<T> {

	boolean isCancelled();

	Collection<WirecenterOptimization<T>> getWirecenterOptimizations();

	Collection<OptimizationException> getOptimizationExceptions();

}
