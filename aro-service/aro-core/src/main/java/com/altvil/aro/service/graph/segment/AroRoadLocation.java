package com.altvil.aro.service.graph.segment;

import com.vividsolutions.jts.geom.Point;

public interface AroRoadLocation {

	public Point getPoint();

	public Point getIntersectionPoint();

	public double getDistanceFromIntersectionPoint();

	public double getOffsetRatio();
	
	
}
