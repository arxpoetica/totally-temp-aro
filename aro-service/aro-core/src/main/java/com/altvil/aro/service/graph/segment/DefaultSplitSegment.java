package com.altvil.aro.service.graph.segment;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.stream.Collectors;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.segment.impl.DefaultGeoRatioSection;
import com.altvil.aro.service.graph.segment.splitter.SplitGeoSegment;
import com.altvil.aro.service.graph.segment.splitter.SubSegment;
import com.altvil.aro.util.geometry.GeometrySplitter;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.StreamUtil;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;

public class DefaultSplitSegment implements SplitGeoSegment {

	public static SplitGeoSegment split(boolean isRoot, GeoSegment geoSegment,
			Collection<PinnedLocation> splitPoints, Geometry geom) {
		return new DefaultSplitSegment(isRoot, geoSegment).split(splitPoints,
				geom);
	}

	public static SplitGeoSegment splitSegments(boolean isRoot,
			GeoSegment geoSegment, Collection<RatioSection> sections) {
		return new DefaultSplitSegment(isRoot, geoSegment)
				.splitSections(sections);
	}

	public static SplitGeoSegment split(GeoSegment geoSegment,
			Collection<PinnedLocation> splitPoints, Geometry geom) {
		return split(false, geoSegment, splitPoints, geom);
	}

	private GeoSegment geoSegment;

	private List<GeoSegmentAssembler> geoSegments;
	private List<SubSegment> subSegments;
	private List<Double> offsets;
	private List<Point> intersectionPoints;
	private boolean isRoot;

	private DefaultSplitSegment(boolean isRoot, GeoSegment geoSegment) {
		super();
		this.isRoot = isRoot;
		this.geoSegment = geoSegment;
	}

	@Override
	public GeoSegment getGeoSegment() {
		return geoSegment;
	}

	public Collection<Point> getIntersectionPoints() {
		return intersectionPoints;
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

	private Collection<RatioSection> fillRatioSectionsFromRatios(
			List<Double> splitPoints) {

		List<RatioSection> result = new ArrayList<>();

		if (splitPoints.get(0) <= 0) { // TODO
			throw new RuntimeException("Offsets violate < 0"
					+ splitPoints.get(0));
		}

		if (splitPoints.get(splitPoints.size() - 1) >= 1) {
			throw new RuntimeException("Offsets violate >= 1 "
					+ splitPoints.get(splitPoints.size() - 1));
		}

		double previous = 0;
		for (Double offset : splitPoints) {
			result.add(new DefaultGeoRatioSection(previous, offset,
					this.geoSegment.getCableConstructionCategory()));
			if (offset < previous) {
				throw new IllegalArgumentException("Inavlid Offsets "
						+ previous + " " + offset);
			}
			previous = offset;
		}
		result.add(new DefaultGeoRatioSection(previous, 1.0, this.geoSegment
				.getCableConstructionCategory()));

		return result;

	}

	private Collection<RatioSection> fillRatioSections(
			Collection<RatioSection> sections) {
		List<RatioSection> result = new ArrayList<>();

		double previousRatio = 0;

		for (RatioSection rs : sections) {
			double ratio = rs.getStartRatioOffset();
			if (previousRatio < ratio) {
				result.add(new DefaultGeoRatioSection(previousRatio, ratio,
						geoSegment.getCableConstructionCategory()));
			}
			result.add(rs);
			previousRatio = rs.getEndRationOffset();
		}
		if (previousRatio < 1.0) {
			result.add(new DefaultGeoRatioSection(previousRatio, 1.0,
					geoSegment.getCableConstructionCategory()));
		}

		return result;
	}

	private List<Double> toSplitPoints(Collection<RatioSection> filledSections) {
		List<Double> result = new ArrayList<>();
		Iterator<RatioSection> itr = filledSections.iterator();
		itr.next();
		while (itr.hasNext()) {
			result.add(itr.next().getStartRatioOffset());
		}
		return result;
	}

	private DefaultSplitSegment split(Collection<RatioSection> filledSections,
			List<Double> offsets) {

		this.offsets = offsets;
		this.subSegments = splitIntoSegments(offsets, filledSections,
				geoSegment.getLineString());
		this.geoSegments = redistribute(subSegments,
				geoSegment.getGeoSegmentAssignments()).stream()
				.map(s -> s.createSubSegment(isRoot, geoSegment))
				.collect(Collectors.toList());

		intersectionPoints = StreamUtil.map(
				this.geoSegments.subList(1, this.geoSegments.size()),
				gs -> GeometryUtil.getStartPoint(gs.getGeoSegment().getLineString()));

		return this;
	}

	private DefaultSplitSegment splitSections(Collection<RatioSection> sections) {

		if (sections.size() == 0) {
			geoSegments = Collections.emptyList();
			return this;
		}

		Collection<RatioSection> filledSections = fillRatioSections(sections);
		List<Double> offsets = toSplitPoints(filledSections);
		return split(filledSections, offsets);

	}

	// Possible API to verify new splitting algorithm
	@SuppressWarnings("unused")
	private DefaultSplitSegment _split(Collection<PinnedLocation> splitPoints,
			Geometry geom) {

		if (splitPoints.size() == 0) {
			geoSegments = Collections.emptyList();
			return this;
		}

		List<Double> offsets = StreamUtil.map(splitPoints,
				pl -> pl.getOffsetRatio());
		return split(fillRatioSectionsFromRatios(offsets), offsets);

	}

	private DefaultSplitSegment split(Collection<PinnedLocation> splitPoints,
			Geometry geom) {

		if (splitPoints.size() == 0) {
			geoSegments = Collections.emptyList();
			return this;
		}

		intersectionPoints = StreamUtil.map(splitPoints,
				PinnedLocation::getPoint);
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
				.map(s -> s.createSubSegment(isRoot, geoSegment))
				.collect(Collectors.toList());

		return this;

	}

	private List<SubSegment> splitIntoSegments(Collection<Double> offsets,
			Collection<RatioSection> sections, Geometry geometry) {

		Collection<Geometry> lines = new GeometrySplitter(geometry)
				.splitAtOffsets(offsets);

		Iterator<Geometry> lineItr = lines.iterator();

		List<SubSegment> segs = new ArrayList<>(sections.size());

		Iterator<RatioSection> itr = sections.iterator();
		while (itr.hasNext()) {
			RatioSection ratioSection = itr.next();
			segs.add(new SubSegment(lineItr.next(), ratioSection
					.getCableConstruction(),
					ratioSection.getStartRatioOffset(), ratioSection
							.getEndRationOffset(), !itr.hasNext()));
		}

		return segs;

	}

	private List<SubSegment> splitIntoSegments(Collection<Double> offsets,
			Geometry geometry) {

		Collection<Geometry> lines = new GeometrySplitter(geometry)
				.splitAtOffsets(offsets);

		Iterator<Geometry> lineItr = lines.iterator();

		List<SubSegment> segs = new ArrayList<>(lines.size());

		double previous = 0;
		for (Double offset : offsets) {
			segs.add(new SubSegment(lineItr.next(), geoSegment
					.getCableConstructionCategory(), previous, offset, false));

			if (offset < previous) {
				throw new IllegalArgumentException("Inavlid Offsets "
						+ previous + " " + offset);
			}

			previous = offset;

		}
		segs.add(new SubSegment(lineItr.next(), geoSegment
				.getCableConstructionCategory(), previous, 1.0, true));

		return segs;

	}

	private Collection<SubSegment> redistribute(Collection<SubSegment> segs,
			Collection<GraphEdgeAssignment> locations) {

		Iterator<SubSegment> itr = segs.iterator();

		SubSegment seg = itr.next();
		for (GraphEdgeAssignment l : locations) {
			while (!seg.isWithinSegment(l.getPinnedLocation().getOffsetRatio())
					&& itr.hasNext()) {
				seg = itr.next();
			}
			seg.add(l);
		}

		return segs;

	}

}
