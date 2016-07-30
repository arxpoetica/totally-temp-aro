package com.altvil.aro.service.graph.segment;

import java.util.Collection;

public interface RatioSection {
	
	double getStartRatioOffset() ;
	double getEndRationOffset() ;
	CableConstruction getCableConstruction() ;
	Collection<RatioSection> split(int count) ;
	
}
