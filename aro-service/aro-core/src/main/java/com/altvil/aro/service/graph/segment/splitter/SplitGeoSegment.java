package com.altvil.aro.service.graph.segment.splitter;

import java.util.List;

import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface SplitGeoSegment extends GeoSegmentAssembler {

	public GeoSegment getGeoSegment();

	public List<GeoSegment> getSubSegments();

}
