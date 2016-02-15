package com.altvil.aro.service.graph.segment.impl;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.AroRoadLocation;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.segment.splitter.GeoSegmentSplitter;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.StreamUtil;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.linearref.LengthIndexedLine;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class DefaultSegmentLocations implements GeoSegment, GeoSegmentAssembler {

	private static List<GraphEdgeAssignment> EMPTY_LOCATIONS = Collections
			.emptyList();

	private GeoSegment parent;
	private double length;
	private Long gid;
	private Geometry geometry;
	private List<GraphEdgeAssignment> roadLocations = EMPTY_LOCATIONS;
	private LengthIndexedLine lengthIndexedLine;
	private double angleInRadians;
	private double geometryLength;

	private DefaultSegmentLocations(GeoSegment parent, double length, Long gid,
			Geometry geometry, List<GraphEdgeAssignment> locations) {
		super();

		this.parent = parent;

		if (geometry.getLength() == 0) {
			// throw new RuntimeException("BANG BANG") ;
		}

		this.length = length;
		this.gid = gid;
		this.geometry = geometry;
		this.lengthIndexedLine = new LengthIndexedLine(this.geometry);
		this.roadLocations = locations;
		this.angleInRadians = GeometryUtil.getAngleToXAxisInRadians(geometry);
		this.geometryLength = this.geometry.getLength();

		if (length < 0)
			throw new IllegalArgumentException("Negative length " + this.length);
	}

	protected DefaultSegmentLocations(GeoSegment parent, double length,
			Long gid, Geometry geometry) {
		this(parent, length, gid, geometry, EMPTY_LOCATIONS);
	}

	public static GeoSegment create(GeoSegment parent, double length, Long gid,
			Geometry geometry,
			Collection<LocationEntityAssignment> roadLocations) {

		return createAssembler(parent, length, gid, geometry, roadLocations)
				.getGeoSegment();
	}

	public static GeoSegmentAssembler createAssembler(GeoSegment parent,
			double length, Long gid, Geometry geometry,
			Collection<LocationEntityAssignment> roadLocations) {

		final DefaultSegmentLocations seg = new DefaultSegmentLocations(parent,
				length, gid, geometry);

		seg.assign(StreamUtil.map(roadLocations,
				a -> GraphAssignmentFactoryImpl.FACTORY
						.debugGreateEdgeAssignment(
								seg.createPinnedLocation(a.getLocation()),
								a.getLocationEntity())));

		return seg;

	}

	@Override
	public GeoSegment getGeoSegment() {
		return this;
	}

	@Override
	public PinnedLocation pinLocation(RoadLocation rl) {
		return createPinnedLocation(rl.getLocationPoint(),
				rl.getRoadSegmentPositionRatio(), rl.getLocationPoint(),
				rl.getDistanceFromRoadSegmentInMeters());
	}

	@Override
	public GeoSegment getParentSegment() {
		return parent;
	}

	@Override
	public GeoSegment getRootSegment() {
		GeoSegment gs = this;
		while (gs.getParentSegment() != null) {
			gs = gs.getParentSegment();
		}
		return gs;
	}

	@Override
	public double getAngleRelativetoXAsisInRadians() {
		return angleInRadians;
	}

	public void assign(List<GraphEdgeAssignment> roadLocations) {
		this.roadLocations = roadLocations;
	}

	@Override
	public String toString() {
		return "Seg(gid=" + gid + ",len=" + length + ")";
	}

	@Override
	public Geometry getLineString() {
		return geometry;
	}

	@Override
	public Long getGid() {
		return gid;
	}

	private double _projectPoint(Point point) {
		double len = lengthIndexedLine.project(point.getCoordinate());
		double result = len / this.geometryLength;

		return result;
	}

	@Override
	public PinnedLocation pinLocation(Point point) {

		double offsetRatio = _projectPoint(point);
		Point intersectPoint = GeometryUtil.asPoint(this.lengthIndexedLine
				.extractPoint(offsetRatio * this.geometryLength));

		return createPinnedLocation(point, offsetRatio, intersectPoint, 0);

	}

	@Override
	public PinnedLocation pinLocation(PinnedLocation pin) {
		double offsetRatio = _projectPoint(pin.getIntersectionPoint());
		Point intersectPoint = pin.getIntersectionPoint();

		return new RebasedPin(createAroRoadLocation(pin.getPoint(),
				offsetRatio, intersectPoint,
				pin.getDistanceFromIntersectionPoint()), pin);
	}

	@Override
	public PinnedLocation proxyPin(double offsetRatio, PinnedLocation pl) {
		Point point = GeometryUtil.projectPointAlongLine(geometry, offsetRatio);
		return new RelocatedPin(new RoadLocationImpl(point, offsetRatio, point,
				0), pl.getOffsetFromEndVertex(), pl);
	}

	@Override
	public Collection<GeoSegment> split(GraphNodeFactory factory,
			Collection<PinnedLocation> pinnedLocations) {
		return new GeoSegmentSplitter(factory).split(this, pinnedLocations,
				geometry);
	}

	@Override
	public PinnedLocation pinLocation(double offsetRatio) {
		Point point = GeometryUtil.projectPointAlongLine(geometry, offsetRatio);
		return createPinnedLocation(point, offsetRatio, point, 0);

	}

	@Override
	public Collection<GraphEdgeAssignment> getGeoSegmentAssignments() {
		return roadLocations;
	}

	@Override
	public List<GeoSegment> split(GraphNodeFactory vertexFactory,
			double offsetRatio) {

		List<PinnedLocation> offsets = new ArrayList<>();
		offsets.add(pinLocation(offsetRatio));
		return new GeoSegmentSplitter(vertexFactory).split(this, offsets,
				geometry);

	}

	@Override
	public GeoSegment reverse() {
		DefaultSegmentLocations seg = new DefaultSegmentLocations(this, length,
				gid, geometry.reverse(), EMPTY_LOCATIONS);

		seg.reverseOriginalLocations(this);

		return seg;
	}

	private void reverseOriginalLocations(GeoSegment original) {
		this.roadLocations = reversePins(original,
				original.getGeoSegmentAssignments());
	}

	private List<GraphEdgeAssignment> reversePins(GeoSegment original,
			Collection<GraphEdgeAssignment> orginalLocations) {

		if (orginalLocations.size() == 0) {
			return EMPTY_LOCATIONS;
		}

		List<GraphEdgeAssignment> updated = StreamUtil.map(orginalLocations,
				a -> GraphAssignmentFactoryImpl.FACTORY
						.debugGreateEdgeAssignment(
								new ReversedPinLocation(a.getPinnedLocation()),
								a.getAroEntity())

		);

		Collections.reverse(updated);

		return updated;

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.graph.transform.builder.AroSegmentLocations#getLength
	 * ()
	 */
	@Override
	public double getLength() {
		return length;
	}

	@Override
	public boolean isEmpty() {
		return roadLocations.isEmpty();
	}

	private AroRoadLocation createAroRoadLocation(Point locationPoint,
			double distanceOffset, Point intersectPoint, double distance) {

		return new RoadLocationImpl(locationPoint, distanceOffset,
				intersectPoint, distance);

	}

	private PinnedLocation createPinnedLocation(Point locationPoint,
			double distanceOffset, Point intersectPoint, double distance) {

		return createPinnedLocation(createAroRoadLocation(locationPoint,
				distanceOffset, intersectPoint, distance));

	}

	private PinnedLocation createPinnedLocation(AroRoadLocation rl) {
		return new PinnedLocationImpl(rl);
	}

	public static class LocationEntityAssignment {
		private LocationEntity locationEntity;
		private AroRoadLocation location;

		public LocationEntityAssignment(LocationEntity locationEntity,
				AroRoadLocation location) {
			this.locationEntity = locationEntity;
			this.location = location;
		}

		public LocationEntity getLocationEntity() {
			return locationEntity;
		}

		public AroRoadLocation getLocation() {
			return location;
		}

	}

	private class PinnedLocationImpl implements PinnedLocation {

		private AroRoadLocation location;
		// private double totalDistanceToVertex;
		private double offset ;

		public PinnedLocationImpl(AroRoadLocation location,
				double offsetInMeters) {
			this.location = location;
			this.offset =  offsetInMeters ;
		}


		public PinnedLocationImpl(AroRoadLocation location) {
			this(location, 0.0);
		}
		
		@Override
		public double offsetFrom(PinnedLocation other) {
			return (getOffsetFromStartVertex() - other.getOffsetFromStartVertex()) + (other.getOffset() - getOffset()) ;
		}
		
		@Override
		public double getEffectiveOffsetFromEndVertex() {
			return getOffsetFromEndVertex() + getOffset() ;
		}

		@Override
		public double getEffectiveOffsetFromStartVertex() {
			return getOffsetFromStartVertex() + getOffset() ;
		}

		@Override
		public double getOffset() {
			return offset ;
		}

		@Override
		public PinnedLocation createRootPin() {
			GeoSegment rootSegment = getRootSegment();
			if (rootSegment == DefaultSegmentLocations.this) {
				return this;
			}

			return rootSegment.pinLocation(this.getPoint());

		}

		@Override
		public int compareTo(PinnedLocation o) {
			return Double.compare(getOffsetRatio(), o.getOffsetRatio());
		}

		@Override
		public GeoSegment getGeoSegment() {
			return DefaultSegmentLocations.this;
		}

		@Override
		public double getOffsetRatio() {
			return location.getOffsetRatio();
		}

		@Override
		public Point getPoint() {
			return location.getPoint();
		}

		@Override
		public Point getIntersectionPoint() {
			return location.getIntersectionPoint();
		}

		@Override
		public double getDistanceFromIntersectionPoint() {
			return location.getDistanceFromIntersectionPoint();
		}

		@Override
		public double getOffsetFromStartVertex() {
			return getOffsetRatio() * length;
		}

		@Override
		public double getOffsetFromEndVertex() {
			return (1 - getOffsetRatio()) * length;
		}

		@Override
		public boolean isAtStartVertex() {
			return getOffsetRatio() == 0;
		}

		@Override
		public boolean isAtEndVertex() {
			return getOffsetRatio() == 1;
		}

	}

	//
	// Holder Class Until Transform system API developed and exposed
	//
	private class ReversedPinLocation extends PinnedLocationImpl {

		// private PinnedLocation sourcePin;

		public ReversedPinLocation(PinnedLocation originalPin) {
			super(new RoadLocationImpl(originalPin.getPoint(),
					1.0 - originalPin.getOffsetRatio(),
					originalPin.getIntersectionPoint(),
					originalPin.getDistanceFromIntersectionPoint()));
		}

	}

	private class RelocatedPin extends PinnedLocationImpl {

		// private PinnedLocation pinnedLocation ;

		public RelocatedPin(AroRoadLocation location, double offsetInMeters,
				PinnedLocation previousLocation) {
			super(location, offsetInMeters);
			// this.pinnedLocation = previousLocation ;
		}

	}

	private class RebasedPin extends PinnedLocationImpl {

		private PinnedLocation originalPin;

		public RebasedPin(AroRoadLocation location, PinnedLocation originalPin) {
			super(location, 0);
			this.originalPin = originalPin;
		}

		@Override
		public PinnedLocation createRootPin() {
			return originalPin;
		}

	}

}
