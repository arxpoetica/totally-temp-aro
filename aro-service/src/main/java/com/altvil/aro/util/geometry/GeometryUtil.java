package com.altvil.aro.util.geometry;

import java.util.function.Function;

import org.postgresql.geometric.PGpoint;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineSegment;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.PrecisionModel;
import com.vividsolutions.jts.io.WKTWriter;

public class GeometryUtil {

	private static final GeometryFactory FACTORY = new GeometryFactory(
			new PrecisionModel(), 4326);

	public static GeometryFactory factory() {
		return FACTORY;
	}

	public static Point asPoint(PGpoint point) {
		return FACTORY.createPoint(new Coordinate(point.x, point.y));
	}

	public static Point asPoint(Coordinate coordinate) {
		return FACTORY.createPoint(coordinate);
	}

	private static Coordinate[] toCoordinates(Coordinate c1, Coordinate c2) {
		Coordinate[] coords = new Coordinate[2];
		coords[0] = c1;
		coords[1] = c2;
		return coords;
	}

	public static LineString createLineString(Coordinate c1, Coordinate c2) {
		return factory().createLineString(toCoordinates(c1, c2));
	}

	public static LineSegment createLineSegment(Coordinate c1, Coordinate c2) {
		return new LineSegment(c1, c2);
	}
	
	public static String toWKT(Geometry point) {
		WKTWriter w = new WKTWriter(2) ;
		return w.write(point) ;
	}
	
	public static Function<Geometry, String> wkt() {
		WKTWriter w = new WKTWriter(2) ;
		return g -> w.write(g) ;
	}

}
