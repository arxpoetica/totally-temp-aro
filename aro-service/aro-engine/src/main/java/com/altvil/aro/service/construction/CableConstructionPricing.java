package com.altvil.aro.service.construction;

import com.altvil.aro.service.graph.segment.CableConstruction;

public interface CableConstructionPricing {
	
	CableConstruction getDefaultCableConstruction() ;
	double price(CableConstruction construction) ;

}
