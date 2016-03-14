package com.altvil.utils;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.operation.distance.DistanceOp;
import com.vividsolutions.jts.operation.distance.GeometryLocation;

public class EditUtilities {

	public static GeometryLocation getVertexToSnap(Geometry g, Point p,
			double tolerance) {
		DistanceOp distanceOp = new DistanceOp(g, p);
		GeometryLocation snapedPoint = distanceOp.nearestLocations()[0];
		if (tolerance == 0
				|| snapedPoint.getCoordinate().distance(p.getCoordinate()) <= tolerance) {
			return snapedPoint;
		}
		return null;

	}
}