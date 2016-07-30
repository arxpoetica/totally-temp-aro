package com.altvil.aro.service.graph.segment;

import java.util.Collection;
import java.util.List;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.model.Reversable;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.transform.GeoSegmentTransform;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;

public interface GeoSegment extends Reversable {

	public GeoSegmentTransform getParentTransform() ;

	public GeoSegment getRootSegment();
	
	public double getEffectiveWeight() ; 
	
	public CableConstruction getCableConstructionCategory() ;

	public Long getGid();

	public double getLength();

	public List<GeoSegment> split(GraphNodeFactory vertexFactory,
			double offsetRatio);

	public Collection<GeoSegment> split(GraphNodeFactory vertexFactory,
			Collection<PinnedLocation> pinnedLocations);

	public PinnedLocation pinLocation(double offsetRatio);

	public PinnedLocation proxyPin(double offsetRatio, PinnedLocation pl);

	public PinnedLocation pinLocation(Point point);
	
	public PinnedLocation pinLocation(PinnedLocation pl) ; 

	public Collection<GraphEdgeAssignment> getGeoSegmentAssignments();

	public Geometry getLineString();

	public double getAngleRelativetoXAsisInRadians();

}