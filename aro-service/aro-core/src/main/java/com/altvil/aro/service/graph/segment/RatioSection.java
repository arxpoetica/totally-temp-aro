package com.altvil.aro.service.graph.segment;

import java.util.Collection;

import com.altvil.interfaces.CableConstructionEnum;

public interface RatioSection {
	
	double getStartRatioOffset() ;
	double getEndRationOffset() ;
	CableConstructionEnum getCableConstruction() ;
	Collection<RatioSection> split(int count) ;
	
}
