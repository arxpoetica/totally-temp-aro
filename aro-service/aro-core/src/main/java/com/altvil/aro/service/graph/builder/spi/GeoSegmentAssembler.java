package com.altvil.aro.service.graph.builder.spi;

import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.interfaces.RoadLocation;

public interface GeoSegmentAssembler {
	
	public GeoSegment getGeoSegment() ; 
	public PinnedLocation pinLocation(RoadLocation rl);
	public PinnedLocation pinLocation(double offsetRatio);

}
