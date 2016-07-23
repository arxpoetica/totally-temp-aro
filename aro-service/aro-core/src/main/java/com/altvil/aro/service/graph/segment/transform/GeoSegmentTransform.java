package com.altvil.aro.service.graph.segment.transform;

import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public interface GeoSegmentTransform {
	
	GeoSegment getTargetGeoSegment() ;
	PinnedLocation toRootEdgePin(PinnedLocation pl) ;

}
