package com.altvil.aro.service.roic.analysis;

import java.util.Collection;

import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.product.ProductSet;


public interface AnalysisBuilder {

	AnalysisBuilder setAnalysisPeriod(int periodInMonths) ;
	AnalysisBuilder addNetworkPenetration(NetworkPenetration penetration) ;
	AnalysisBuilder setProductSets(Collection<ProductSet> productSets) ;
	
	
}
