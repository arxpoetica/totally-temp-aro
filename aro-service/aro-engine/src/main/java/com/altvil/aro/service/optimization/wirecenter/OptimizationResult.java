package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.optimization.spi.OptimizationException;

public interface OptimizationResult<T> {

	long getPlanId() ;
	WirecenterOptimizationRequest getOptimizationRequest() ;
	OptimizationException getOpitmizationException() ;
	T getResult() ;

	
}
