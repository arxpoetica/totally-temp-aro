package com.altvil.utils;

import com.vividsolutions.jts.algorithm.Angle;
import com.vividsolutions.jts.geom.*;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.WKTReader;
import com.vividsolutions.jts.io.WKTWriter;
import com.vividsolutions.jts.linearref.LengthIndexedLine;
import com.vividsolutions.jts.linearref.LocationIndexedLine;
import com.vividsolutions.jts.operation.distance.GeometryLocation;
import org.postgresql.geometric.PGpoint;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Function;

public class GeometryUtil {

	public static final double PRECISION = 10E-6;
	private static final GeometryFactory FACTORY = new GeometryFactory(
			new PrecisionModel(), 4326);
	private static final WKTReader WKT_READER = new WKTReader(FACTORY);

	public static GeometryFactory factory() {
		return FACTORY;
	}

	public static Point asPoint(PGpoint point) {
		return FACTORY.createPoint(new Coordinate(point.x, point.y));
	}

	public static Point asPoint(Coordinate coordinate) {
		return FACTORY.createPoint(coordinate);
	}

	public static Point asPoint(Point point) {
		return FACTORY.createPoint(point.getCoordinate());
	}

	public static Polygon asPolygon(Polygon polygon) {
		return FACTORY.createPolygon(polygon.getCoordinates());
	}
	
	public static MultiPolygon asMultiPolygon(MultiPolygon multiPolygon) {
		
		Polygon[] polygons = new Polygon[multiPolygon.getNumGeometries()] ;
		for(int i=0 ; i < multiPolygon.getNumGeometries() ; i++) {
			polygons[i] = asPolygon((Polygon) multiPolygon.getGeometryN(i));
		}
		
		return FACTORY.createMultiPolygon(polygons) ;
	}

	public static LineString asLineString(LineString lineString) {
		return FACTORY.createLineString(lineString.getCoordinates());
	}
	
	public static MultiLineString asMultiLinString(MultiLineString multiLineString) {
		LineString[] strings = new LineString[multiLineString.getNumGeometries()] ;
		for(int i=0 ; i < multiLineString.getNumGeometries() ; i++) {
			strings[i] = asLineString((LineString) multiLineString.getGeometryN(i));
		}
	
		return FACTORY.createMultiLineString(strings) ;
	}
	
	
	public static List<Point> asPoints(Geometry geometry) {
		return StreamUtil.map(geometry.getCoordinates(), GeometryUtil::asPoint) ;
	}
	
	public static List<org.postgis.Point> asPostGisPoints(Geometry geometry) {
		return StreamUtil.map(geometry.getCoordinates(), c -> new org.postgis.Point(c.x,c.y)) ;
	}
	
	
	
	
	public static final LineString asLineString(Geometry geometry) {
		
		if( geometry instanceof LineString ) {
			return (LineString) geometry ;
		}
		
		
		if( geometry instanceof MultiLineString ) {
			MultiLineString mls =  (MultiLineString)  geometry ;
			if( mls.getNumGeometries() == 1 ) {
				return asLineString(mls.getGeometryN(1)) ;
			}
		}
		
		throw new ClassCastException("Unable to cast " + geometry.toString() + " as LineString") ;
	}
	
	public static final MultiLineString asMultiLineString(Geometry geometry) {
		
		if( geometry instanceof MultiLineString ) {
			return (MultiLineString)  geometry ;
		}
		
		if( geometry instanceof LineString ) {
			return FACTORY.createMultiLineString(new LineString[]{(LineString) geometry}) ;
		}
		
		throw new ClassCastException("Unable to cast " + geometry.toString() + " as MultiLineString") ;
	
	}

	public static boolean equalsRatio(double a, double b) {
		return Math.abs(a - b) < PRECISION;
	}

	private static Coordinate[] toCoordinates(Coordinate c1, Coordinate c2) {
		Coordinate[] coords = new Coordinate[2];
		coords[0] = c1;
		coords[1] = c2;
		return coords;
	}

	public static double getAngleToXAxisInRadians(Geometry geometry) {
		LocationIndexedLine lineRef = new LocationIndexedLine(geometry);
		return Angle.angle(lineRef.extractPoint(lineRef.getStartIndex()),
				lineRef.extractPoint(lineRef.getEndIndex()));
	}

	public static Point projectPointAlongLine(Geometry line, double offsetRatio) {
		LengthIndexedLine lil = new LengthIndexedLine(line);
		return asPoint(lil.extractPoint(offsetRatio * line.getLength()));
	}

	public static Point getStartPoint(Geometry geometry) {
		LocationIndexedLine lineRef = new LocationIndexedLine(geometry);
		return asPoint(lineRef.extractPoint(lineRef.getStartIndex()));
	}

	public static Point getEndPoint(Geometry geometry) {
		LocationIndexedLine lineRef = new LocationIndexedLine(geometry);
		return asPoint(lineRef.extractPoint(lineRef.getEndIndex()));
	}

	public static Geometry toGeometry(String wkt) throws ParseException {
		return WKT_READER.read(wkt);
	}

	public static LineString createLineString(Coordinate c1, Coordinate c2) {
		return factory().createLineString(toCoordinates(c1, c2));
	}

	public static LineString createLineString(Point p1, Point p2) {
		return factory().createLineString(
				toCoordinates(p1.getCoordinate(), p2.getCoordinate()));
	}

	public static LineSegment createLineSegment(Coordinate c1, Coordinate c2) {
		return new LineSegment(c1, c2);
	}

	public static String toWKT(Geometry point) {
		WKTWriter w = new WKTWriter(2);
		return w.write(point);
	}

	public static Function<Geometry, String> wkt() {
		WKTWriter w = new WKTWriter(2);
		return g -> w.write(g);
	}

	public static List<Geometry> split(LineString lineString,
			Collection<Point> pointsToSplit) {

		// List<Geometry> result = new ArrayList<Geometry>(pointsToSplit.size()
		// + 1) ;
		// for(int i = 0 ; i<pointsToSplit.size()+1 ; i++) {
		// result.add(lineString) ;
		// }
		// return result ;

		return split(lineString, pointsToSplit, 0);
	}

	public static List<Geometry> split(LineString lineString,
			Collection<Point> pointsToSplit, double tolerance) {

		List<Geometry> result = new ArrayList<>();

		LineString remainder = lineString;
		for (Point p : pointsToSplit) {
			LineString[] splits = splitLineStringWithPoint(remainder, p,
					tolerance);

			if (splits[0].getLength() == 0 || splits[1].getLength() == 0) {
				throw new RuntimeException("0 Length Geoemtry");
			}

			remainder = splits[1];
			result.add(splits[0]);

		}
		result.add(remainder);

		return result;

	}

	public static LineString[] splitLineStringWithPoint(LineString line,
			Point pointToSplit, double tolerance) {
		Coordinate[] coords = line.getCoordinates();
		Coordinate firstCoord = coords[0];
		Coordinate lastCoord = coords[coords.length - 1];
		Coordinate coordToSplit = pointToSplit.getCoordinate();
		if ((coordToSplit.distance(firstCoord) <= PRECISION)
				|| (coordToSplit.distance(lastCoord) <= PRECISION)) {
			return new LineString[] { line };
		} else {
			ArrayList<Coordinate> firstLine = new ArrayList<Coordinate>();
			firstLine.add(coords[0]);
			ArrayList<Coordinate> secondLine = new ArrayList<Coordinate>();
			GeometryLocation geometryLocation = EditUtilities.getVertexToSnap(
					line, pointToSplit, tolerance);
			if (geometryLocation != null) {
				int segmentIndex = geometryLocation.getSegmentIndex();
				Coordinate coord = geometryLocation.getCoordinate();
				int index = -1;
				for (int i = 1; i < coords.length; i++) {
					index = i - 1;
					if (index < segmentIndex) {
						firstLine.add(coords[i]);
					} else if (index == segmentIndex) {
						coord.z = CoordinatesUtils.interpolate(coords[i - 1],
								coords[i], coord);
						firstLine.add(coord);
						secondLine.add(coord);
						if (!coord.equals2D(coords[i])) {
							secondLine.add(coords[i]);
						}
					} else {
						secondLine.add(coords[i]);
					}
				}
				LineString lineString1 = FACTORY.createLineString(firstLine
						.toArray(new Coordinate[firstLine.size()]));
				LineString lineString2 = FACTORY.createLineString(secondLine
						.toArray(new Coordinate[secondLine.size()]));
				return new LineString[] { lineString1, lineString2 };
			}
		}
		return null;
	}


}
