package com.altvil.aro.service.graph.segment.impl;

import com.altvil.aro.service.graph.segment.AroRoadLocation;
import com.vividsolutions.jts.geom.Point;

public class RoadLocationImpl implements AroRoadLocation {

	private Point locationPoint;
	private double distanceOffset;
	private Point intersectPoint;
	private double distance;

	public RoadLocationImpl(Point locationPoint, double distanceOffset,
			Point intersectPoint, double distance) {
		super();
		this.locationPoint = locationPoint;
		this.distanceOffset = distanceOffset;
		this.intersectPoint = intersectPoint;
		this.distance = distance;
	}

	@Override
	public Point getPoint() {
		return locationPoint;
	}

	@Override
	public Point getIntersectionPoint() {
		return intersectPoint;
	}

	@Override
	public double getDistanceFromIntersectionPoint() {
		return distance;
	}

	@Override
	public double getOffsetRatio() {
		return distanceOffset;
	}

	
}