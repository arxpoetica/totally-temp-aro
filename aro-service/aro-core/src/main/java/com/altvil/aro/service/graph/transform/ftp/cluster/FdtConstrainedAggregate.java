package com.altvil.aro.service.graph.transform.ftp.cluster;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.algorithm.CentroidPoint;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class FdtConstrainedAggregate implements LocationCluster {

	double coverage;
	private FtthThreshholds thresholds;
	private List<GraphEdgeAssignment> locationIntersections;
	private GeoSegment geoSegment;
	private ClusterLocation clusterLocation;

	public FdtConstrainedAggregate(GeoSegment geoSegment, FtthThreshholds thresholds) {
		this.geoSegment = geoSegment;
		this.thresholds = thresholds;
		locationIntersections = new ArrayList<>(
				thresholds.getMaxlocationPerFDT());

		clusterLocation = new ClusterLocation(thresholds, geoSegment);

	}

	@Override
	public GeoSegment geoGeoSegment() {
		return geoSegment;
	}

	public int getPinCount() {
		return locationIntersections.size();
	}

	@Override
	public double getLongestDistanceToEndVertex() {

		if (locationIntersections.size() == 0) {
			return 0;
		}

		PinnedLocation pl = locationIntersections.get(0).getPinnedLocation();
		return pl.getEffectiveOffsetFromEndVertex()
				+ pl.getDistanceFromIntersectionPoint();

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.graph.transform.fd.LocationAggregate#locationCount
	 * ()
	 */
	@Override
	public double getLocationCount() {
		return coverage;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.aro.service.graph.transform.fd.LocationAggregate#canAdd()
	 */
	@Override
	public boolean canAdd(GraphEdgeAssignment li) {
		LocationEntity entity = (LocationEntity) li.getAroEntity();
		double testedDemand = entity.getLocationDemand().getHouseholdFiberDemandValue();
		return (getLocationCount() + testedDemand) <= thresholds
				.getMaxlocationPerFDT();

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.graph.transform.fd.LocationAggregate#isEmpty()
	 */
	@Override
	public boolean isEmpty() {
		return locationIntersections.size() == 0 || coverage == 0 ;
	}

	//
	// TODO add constraint
	//
	private boolean ensureConstraint(PinnedLocation pin) {

		return clusterLocation.add(pin);

	}

	public boolean add(GraphEdgeAssignment li) {

		// Basis Constraint (TODO expanded Spatial Constraint)
		if (!canAdd(li) || !ensureConstraint(li.getPinnedLocation())) {
			return false;
		}
		coverage += (((LocationEntity) li.getAroEntity())
				.getLocationDemand().getHouseholdFiberDemandValue());
		locationIntersections.add(li);
		return true;

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.graph.transform.fd.LocationAggregate#toPinnedLocation
	 * ()
	 */
	@Override
	public PinnedLocation getPinnedLocation() {

		return clusterLocation.getFdtLocation();

		//
		// List<GraphEdgeAssignment> nodes = this.locationIntersections;
		//
		// if (nodes.size() == 0) {
		// return null;
		// }
		//
		// if (nodes.size() == 1) {
		// return nodes.get(0).getPinnedLocation();
		// } else {
		//
		// CentroidPoint centroid = new CentroidPoint();
		// nodes.stream().map(n -> n.getPinnedLocation().getPoint())
		// .forEach(p -> centroid.add(p));
		//
		// return segmentLocations.pinLocation(GeometryUtil.asPoint(centroid
		// .getCentroid()));
		// }

	}

	@Override
	public Collection<GraphEdgeAssignment> getLocations() {
		return locationIntersections;
	}

	public double calculateDropLength(PinnedLocation pl) {
		return Math.abs(getPinnedLocation().offsetFrom(pl))
				+ pl.getDistanceFromIntersectionPoint();
	}

	private static class ClusterLocation {
		private GeoSegment geoSegment;

		private CentroidPoint centroid;
		private PinnedLocation fdtLocation;

		private List<Double> offsets = new ArrayList<>();
		private List<Double> maxLocationOffset = new ArrayList<>();

		private double startOffset;
		private double preferredDropOffsetInMeters;

		public ClusterLocation(FtthThreshholds thresholds, GeoSegment geoSegment) {
			init(geoSegment);
			preferredDropOffsetInMeters = thresholds
					.getPreferredDropCableLengthInMeters();
		}

		public void init(GeoSegment geoSegment) {

			this.geoSegment = geoSegment;

			centroid = new CentroidPoint();
			fdtLocation = null;

			offsets.clear();
			maxLocationOffset.clear();
		}

		private int indexOf(PinnedLocation pl) {
			int index = Collections.binarySearch(offsets,
					pl.getOffsetFromStartVertex() - startOffset);
			return Math.min(index >= 0 ? index : (index * -1) - 1,
					offsets.size() - 1);
		}

		public PinnedLocation getFdtLocation() {
			return fdtLocation;
		}

		private boolean validateFirstLocation(PinnedLocation fdt) {
			int index = indexOf(fdt);
			double distanceToFirstPin = ((fdt.getOffsetFromStartVertex() - startOffset) - offsets
					.get(index)) + maxLocationOffset.get(index);
			return distanceToFirstPin <= preferredDropOffsetInMeters;
		}

		private boolean validateLastLocation(PinnedLocation thisPin,
				PinnedLocation fdtPin) {
			
			return (Math.abs(thisPin.offsetFrom(fdtPin)) + thisPin
					.getDistanceFromIntersectionPoint()) <= preferredDropOffsetInMeters;
		}

		public boolean add(PinnedLocation thisPin) {

			centroid.add(thisPin.getPoint());

			if (fdtLocation == null) {

				startOffset = thisPin.getOffsetFromStartVertex();

				offsets.add(0.0);
				// Carefully handle the case when offset thisPin is relocated
				// from a previous segment
				maxLocationOffset.add(thisPin.getOffset()
						+ thisPin.getDistanceFromIntersectionPoint());

				fdtLocation = thisPin;

				return true;
			}

			PinnedLocation nextFdtPin = geoSegment.pinLocation(GeometryUtil
					.asPoint(centroid.getCentroid()));
			
			double thisOffset = thisPin.getOffsetFromStartVertex()
					- startOffset;
			
			double lastOffset = maxLocationOffset.get(offsets.size() -1) ;
			offsets.add(thisOffset);
			// Dynamic Programming induction To maintain longest Drop cable
			// starting at first location
			//
			maxLocationOffset.add(Math.max(
					lastOffset + thisOffset,
					thisPin.getDistanceFromIntersectionPoint()));

			if (validateFirstLocation(nextFdtPin)
					&& validateLastLocation(thisPin, nextFdtPin)) {
				this.fdtLocation = nextFdtPin;
				return true;
			}

			return false;
		}
	}

}
