package com.altvil.aro.service.optimization.spi;

import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;

public interface OptimizationListener {

	void onWirecenterFinished(WirecenterOptimizationRequest request,
			PrunedNetwork network);
	
	void onWirecenterError(WirecenterOptimizationRequest request, OptimizationException exception) ;
	
	void onOptimizationComplete() ;
	
	void onOptimizationCancelled() ;

}
