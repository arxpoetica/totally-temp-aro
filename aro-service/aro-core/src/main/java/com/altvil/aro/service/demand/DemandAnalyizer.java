package com.altvil.aro.service.demand;

import com.altvil.aro.service.graph.segment.GeoSegment;

public interface DemandAnalyizer {

	EdgeDemand createDemandAnalyis(GeoSegment geoSegment);

}