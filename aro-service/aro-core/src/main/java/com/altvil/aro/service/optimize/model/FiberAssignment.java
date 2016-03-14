package com.altvil.aro.service.optimize.model;

import java.util.Collection;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface FiberAssignment extends MaterialAssigment {

	public FiberAssignment union(FiberAssignment other);

	public Collection<AroEdge<GeoSegment>> getEdges();

	public FiberType getFiberType() ;
	
	public double getFiberLengthInMeters();

}
