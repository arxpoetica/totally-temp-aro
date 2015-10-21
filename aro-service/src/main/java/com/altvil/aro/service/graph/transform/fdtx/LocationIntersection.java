package com.altvil.aro.service.graph.transform.fdtx;

import com.altvil.aro.service.graph.node.RoadNode;
import com.vividsolutions.jts.geom.Point;

public class LocationIntersection 
{
	private double offsetFromStart;
	private RoadNode roadNode;

	public LocationIntersection(double offsetFromStart, RoadNode roadNode) {
		super();
		this.offsetFromStart = offsetFromStart;
		this.roadNode = roadNode;
	}

	public double getOffsetFromStart() {
		return offsetFromStart;
	}

	public RoadNode getRoadNode() {
		return roadNode;
	}

	public Point getLocationPoint() {
		return roadNode.getLocationNode().getPoint();
	}
}