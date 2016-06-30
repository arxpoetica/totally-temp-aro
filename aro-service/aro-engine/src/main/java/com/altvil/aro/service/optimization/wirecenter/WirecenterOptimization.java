package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.optimization.spi.OptimizationException;


//TODO Generalize to ComputeUnit 
public interface WirecenterOptimization<T> {

	long getPlanId() ;
	
	WirecenterOptimizationRequest getOptimizationRequest() ;
	OptimizationException getOpitmizationException() ;
	T getResult() ;

	
}
