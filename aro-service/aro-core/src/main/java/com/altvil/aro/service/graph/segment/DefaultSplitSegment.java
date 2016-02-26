package com.altvil.aro.service.graph.segment;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.stream.Collectors;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.segment.splitter.SplitGeoSegment;
import com.altvil.aro.service.graph.segment.splitter.SubSegment;
import com.altvil.aro.util.geometry.GeometrySplitter;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.StreamUtil;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;

public class DefaultSplitSegment implements SplitGeoSegment {

	public static SplitGeoSegment split(GeoSegment geoSegment,
			Collection<PinnedLocation> splitPoints, Geometry geom) {
		return new DefaultSplitSegment(geoSegment).split(splitPoints, geom);
	}

	private GeoSegment geoSegment;

	private List<GeoSegmentAssembler> geoSegments;
	private List<SubSegment> subSegments;
	private List<Double> offsets;

	private DefaultSplitSegment(GeoSegment geoSegment) {
		super();
		this.geoSegment = geoSegment;
	}

	@Override
	public GeoSegment getGeoSegment() {
		return geoSegment;
	}

	@Override
	public List<GeoSegment> getSubSegments() {
		return StreamUtil.map(geoSegments, s -> s.getGeoSegment());
	}

	private int indexOf(double offsetRatio) {
		int index = Collections.binarySearch(offsets, offsetRatio);
		return index < 0 ? Math.min((index * -1) - 1, geoSegments.size() - 1)
				: index;
	}

	private RoadLocation rebaseLocation(RoadLocation rl, double offsetRatio) {
		return new RoadLocation() {
			@Override
			public long getTlid() {
				return rl.getTlid();
			}

			@Override
			public double getRoadSegmentPositionRatio() {
				return offsetRatio;
			}

			@Override
			public long getRoadSegmentId() {
				return rl.getRoadSegmentId();
			}

			@Override
			public Point getRoadSegmentClosestPoint() {
				return rl.getRoadSegmentClosestPoint();
			}

			@Override
			public double getDistanceFromRoadSegmentInMeters() {
				return rl.getDistanceFromRoadSegmentInMeters();
			}

			@Override
			public Point getLocationPoint() {
				return rl.getLocationPoint();
			}
			
		};
	}

	@Override
	public PinnedLocation pinLocation(double offsetRatio) {
		int index = indexOf(offsetRatio);
		return geoSegments.get(index).pinLocation(
				subSegments.get(index).computeSegmentOffset(offsetRatio));
	}

	@Override
	public PinnedLocation pinLocation(RoadLocation rl) {

		if (geoSegments.size() == 0) {
			return ((GeoSegmentAssembler) geoSegment).pinLocation(rl);
		}

		int index = indexOf(rl.getRoadSegmentPositionRatio());
		RoadLocation rebasedLocation = rebaseLocation(
				rl,
				subSegments.get(index).computeSegmentOffset(
						rl.getRoadSegmentPositionRatio()));
		return geoSegments.get(index).pinLocation(rebasedLocation);
	}

	private DefaultSplitSegment split(Collection<PinnedLocation> splitPoints,
			Geometry geom) {

		if (splitPoints.size() == 0) {
			geoSegments = Collections.emptyList();
			return this;
		}

		offsets = StreamUtil.map(splitPoints, pl -> pl.getOffsetRatio());

		if (offsets.get(0) < 0) { // TODO
			throw new RuntimeException("Offsets violate < 0" + offsets.get(0));
		}

		if (offsets.get(offsets.size() - 1) >= 1) {
			throw new RuntimeException("Offsets violate > 1 "
					+ offsets.get(offsets.size() - 1));
		}

		subSegments = splitIntoSegments(offsets, geom);

		geoSegments = redistribute(subSegments,
				geoSegment.getGeoSegmentAssignments()).stream()
				.map(s -> s.createSubSegment(geoSegment))
				.collect(Collectors.toList());

		return this;

	}

	private List<SubSegment> splitIntoSegments(Collection<Double> offsets,
			Geometry geometry) {

		Collection<Geometry> lines = new GeometrySplitter(geometry)
				.splitAtOffsets(offsets);

		Iterator<Geometry> lineItr = lines.iterator();

		List<SubSegment> segs = new ArrayList<>(lines.size());

		double previous = 0;
		for (Double offset : offsets) {
			segs.add(new SubSegment(lineItr.next(), previous, offset, false));

			if (offset < previous) {
				throw new IllegalArgumentException("Inavlid Offsets "
						+ previous + " " + offset);
			}

			previous = offset;

		}
		segs.add(new SubSegment(lineItr.next(), previous, 1.0, true));

		return segs;

	}

	private Collection<SubSegment> redistribute(Collection<SubSegment> segs,
			Collection<GraphEdgeAssignment> locations) {

		Iterator<SubSegment> itr = segs.iterator();

		SubSegment seg = itr.next();
		for (GraphEdgeAssignment l : locations) {
			while (!seg.isWithinSegment(l.getPinnedLocation().getOffsetRatio()) && itr.hasNext()) {
				seg = itr.next();
			}
			seg.add(l);
		}

		return segs;

	}

}
