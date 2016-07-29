package com.altvil.aro.service.construction;

import com.altvil.aro.service.graph.segment.CableConstruction;
import com.altvil.interfaces.CableConstructionEnum;

public interface CableConstructionPricing {
	
	CableConstruction price(CableConstructionEnum type) ;

}
