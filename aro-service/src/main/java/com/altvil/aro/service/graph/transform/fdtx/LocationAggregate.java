package com.altvil.aro.service.graph.transform.fdtx;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.node.RoadNode;
import com.altvil.aro.util.geometry.GeometryUtil;
import com.vividsolutions.jts.algorithm.CentroidPoint;
import com.vividsolutions.jts.geom.LineSegment;
import com.vividsolutions.jts.geom.Point;

public class LocationAggregate {

	private int maxCount;

	private GraphNodeFactory nodeFactory ;
	private List<LocationIntersection> locationIntersections;

	public LocationAggregate(GraphNodeFactory nodeFactory, int maxCount) {
		this.nodeFactory = nodeFactory ;
		this.maxCount = maxCount;
		locationIntersections = new ArrayList<>(maxCount);
	}

	public int locationCount() {
		return locationIntersections.size();
	}

	public boolean isFull() {
		return locationIntersections.size() == maxCount;
	}

	public boolean isEmpty() {
		return locationIntersections.size() == 0;
	}

	public boolean add(LocationIntersection li) {

		// Basis Constraint (TODO expanded Spatial Constraint)
		if (isFull()) {
			return false;
		}

		locationIntersections.add(li);
		return true;

	}

	public FDTNode toFDTNode() {

		List<RoadNode> nodes = locationIntersections.stream()
				.map(l -> l.getRoadNode()).collect(Collectors.toList());

		if (nodes.size() == 0) {
			return null;
		}

		if (nodes.size() == 1) {
			return nodeFactory.createFDTNode(null, nodes.get(0).getPoint());
		} else {

			CentroidPoint centroid = new CentroidPoint();
			nodes.stream().map(n -> n.getLocationNode().getPoint())
					.forEach(p -> centroid.add(p));

			LineSegment ls = GeometryUtil.createLineSegment(nodes.get(0)
					.getPoint().getCoordinate(), nodes
					.get(nodes.size() - 1).getPoint().getCoordinate());

			Point point = GeometryUtil.asPoint(centroid.getCentroid());

			Point fdtPoint = GeometryUtil.factory().createPoint(
					ls.closestPoint(point.getCoordinate()));

			return nodeFactory.createFDTNode(null, fdtPoint);
		}

	}

}
