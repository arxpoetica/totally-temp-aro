package com.altvil.aro.service.graph.segment.splitter;

import com.altvil.aro.service.graph.segment.GeoSegment;

@FunctionalInterface
public interface EdgeWeightFunction {
	
	double computeWeight(GeoSegment geoSegment) ;

}
