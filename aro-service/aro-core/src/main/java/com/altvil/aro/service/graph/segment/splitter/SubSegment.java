package com.altvil.aro.service.graph.segment.splitter;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.segment.AroRoadLocation;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.aro.service.graph.segment.impl.RoadLocationImpl;
import com.vividsolutions.jts.geom.Geometry;

import java.util.ArrayList;
import java.util.List;

public class SubSegment implements Comparable<SubSegment> {
	private double start;
	private double endExc;
	private boolean isLastSegment;
	private double range;

	private Geometry geometry;
	private List<LocationEntityAssignment> locations = new ArrayList<>();

	public SubSegment(Geometry geometry, double start, double endExc,
			boolean isLastSegment) {
		super();

		if (geometry.getLength() == 0) {
			throw new RuntimeException("BANG BANG BANG");
		}

		this.geometry = geometry;
		this.start = start;
		this.endExc = endExc;
		this.isLastSegment = isLastSegment;

		this.range = endExc - start;

		if (this.endExc <= this.start)
			new IllegalArgumentException("Negative Range " + this.range);

	}

	@Override
	public int compareTo(SubSegment o) {
		return Double.compare(start, o.start);
	}

	private double getRange() {
		return range;
	}

	public GeoSegmentAssembler createSubSegment(GeoSegment seg) {
		return DefaultSegmentLocations.createAssembler(seg, seg.getLength() * getRange(),
				seg.getGid(), geometry, locations);
	}

	public boolean isWithinSegment(double offset) {
		return offset >= start && (isLastSegment || offset < endExc);
	}

	private double computeSegementOffset(PinnedLocation location) {
		return computeSegmentOffset(location.getOffsetRatio());
	}
	
	public double computeSegmentOffset(double offsetRatio) {
		return (offsetRatio - start) / range;
	}

	public void add(GraphEdgeAssignment assignment) {

		PinnedLocation pl = assignment.getPinnedLocation();

		AroRoadLocation rl = new RoadLocationImpl(pl.getPoint(),
				computeSegementOffset(pl), pl.getIntersectionPoint(),
				pl.getDistanceFromIntersectionPoint());

		locations.add(new LocationEntityAssignment((LocationEntity) assignment
				.getAroEntity(), rl));
	}
}
