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
import java.util.List;

@Deprecated
public class FDTLocationAggregate implements LocationCluster {

	double coverage;
	private FtthThreshholds thresholds;
	private List<GraphEdgeAssignment> locationIntersections;
	// private CentroidPoint runningCentroid;
	private GeoSegment geoSegment;
	
	public FDTLocationAggregate(GeoSegment geoSegment, FtthThreshholds thresholds) {
		this.geoSegment = geoSegment;
		this.thresholds = thresholds;
		locationIntersections = new ArrayList<>(
				thresholds.getMaxlocationPerFDT());
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
		return locationIntersections.size() == 0;
	}

	//
	// TODO add constraint
	//
	private boolean ensureConstraint(PinnedLocation pin) {

		if (locationIntersections.size() == 0) {
			return true;
		}

		return true;

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

		List<GraphEdgeAssignment> nodes = this.locationIntersections;

		if (nodes.size() == 0) {
			return null;
		}

		if (nodes.size() == 1) {
			return nodes.get(0).getPinnedLocation();
		} else {

			CentroidPoint centroid = new CentroidPoint();
			nodes.stream().map(n -> n.getPinnedLocation().getPoint())
					.forEach(p -> centroid.add(p));

			return geoSegment.pinLocation(GeometryUtil.asPoint(centroid
					.getCentroid()));
		}

	}

	@Override
	public Collection<GraphEdgeAssignment> getLocations() {
		return locationIntersections;
	}

}
