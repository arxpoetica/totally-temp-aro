package com.altvil.aro.service.graph.segment.splitter;

import java.util.Collection;
import java.util.List;

import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.vividsolutions.jts.geom.Point;

public interface SplitGeoSegment extends GeoSegmentAssembler {

	public GeoSegment getGeoSegment();

	public List<GeoSegment> getSubSegments();
	public Collection<Point> getIntersectionPoints() ;

}
