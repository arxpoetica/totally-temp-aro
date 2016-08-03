package com.altvil.aro.service.graph.segment;

import java.io.Serializable;

import com.altvil.interfaces.CableConstructionEnum;

public interface CableConstruction extends Serializable {
	
	CableConstructionEnum getCableConstructionEnum() ;
	double getPricePetMeter() ;

}
