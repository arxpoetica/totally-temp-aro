package com.altvil.aro.service.optimization;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface OptimizedPlan {
	
	 OptimizationConstraints getOptimizationConstraints() ;
	 WirecenterNetworkPlan getWirecenterNetworkPlan() ;

}
