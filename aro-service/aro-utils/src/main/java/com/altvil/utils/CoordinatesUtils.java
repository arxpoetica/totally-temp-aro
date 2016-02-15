package com.altvil.utils;

import com.vividsolutions.jts.geom.*;

public class CoordinatesUtils  {

	private CoordinatesUtils() {
	}
 
       public static double interpolate(Coordinate firstCoordinate, Coordinate lastCoordinate, Coordinate toBeInterpolated) {
              if (Double.isNaN(firstCoordinate.z)) {
                        return Double.NaN;
                }
                if (Double.isNaN(lastCoordinate.z)) {
                         return Double.NaN;
               }
               return firstCoordinate.z + (lastCoordinate.z - firstCoordinate.z) * firstCoordinate.distance(toBeInterpolated)
	                         / (firstCoordinate.distance(toBeInterpolated) + toBeInterpolated.distance(lastCoordinate));
        }

	public static boolean contains(Coordinate[] coords, Coordinate coord) {
	                for (Coordinate coordinate : coords) {
                       if (Double.isNaN(coord.z)) {
	                             return coordinate.equals(coord);
                     } else {
                            return coordinate.equals3D(coord);
                        }
                }
                return false;
         }

	public static boolean contains2D(Coordinate[] coords, Coordinate coord) {
	                  for (Coordinate coordinate : coords) {
	                       if (coordinate.equals2D(coord)) {
                                return true;
                        }
	                }
                 return false;
	        }

	public static boolean contains3D(Coordinate[] coords, Coordinate coord) {
	                for (Coordinate coordinate : coords) {
	                         if (coordinate.equals3D(coord)) {
	                                   return true;
                         }
                 }
                 return false;
        }
	
       public static double[] zMinMax(final Coordinate[] cs) {
                double zmin;
	                double zmax;
	               boolean validZFound = false;
                 double[] result = new double[2];

                 zmin = Double.NaN;
                zmax = Double.NaN;

	                double z;

	                for (int t = cs.length - 1; t >= 0; t--) {
	                        z = cs[t].z;

						if (!(Double.isNaN(z))) {
                                if (validZFound) {
                                         if (z < zmin) {
	                                                zmin = z;
	                                        }

                                         if (z > zmax) {
                                                 zmax = z;
                                       }
                                 } else {
                                        validZFound = true;
                                         zmin = z;
                                         zmax = z;
	                                 }
                        }
	                 }

		   result[0] = (zmin);
	                 result[1] = (zmax);
	                return result;
	        }

	public static Coordinate[] getFurthestCoordinate(Coordinate base, Coordinate[] coords) {
	                 double distanceMax = Double.MIN_VALUE;
	                Coordinate farCoordinate = null;
	                 for (Coordinate coord : coords) {
	                         double distance = coord.distance(base);
                        if (distance > distanceMax) {
                                distanceMax = distance;
                               farCoordinate = coord;
                        }
                 }

		if (farCoordinate != null) {
	                       return new Coordinate[]{base, farCoordinate};
                } else {
                       return null;
                }
        }

	public static double length3D(CoordinateSequence pts) {
                 // optimized for processing CoordinateSequences
	                int n = pts.size();
                if (n <= 1) {
	                         return 0.0;
                 }

               double len = 0.0;

	                Coordinate p = new Coordinate();
	                pts.getCoordinate(0, p);
	                 double x0 = p.x;
	                double y0 = p.y;
                 double z0 = p.z;

		if (Double.isNaN(z0)) {
	                        return 0.0;
	                }

		for (int i = 1; i < n; i++) {
                        pts.getCoordinate(i, p);

                         double x1 = p.x;
                         double y1 = p.y;
                        double z1 = p.z;
                        if (Double.isNaN(z1)) {
                                 return 0.0;
                         }
                      double dx = x1 - x0;
                      double dy = y1 - y0;
	                           double dz = z1 - z0;

			len += Math.sqrt(dx * dx + dy * dy + dz * dz);
	                           x0 = x1;
	                           y0 = y1;
	                           z0 = z1;
	                   }
	                   return len;
	         }

	public static double length3D(Geometry geom) {
	                  double sum = 0;
	                   for (int i = 0; i < geom.getNumGeometries(); i++) {
	                           Geometry subGeom = geom.getGeometryN(i);
	                           if (subGeom instanceof Polygon) {
	                                   sum += length3D((Polygon) subGeom);
	                         } else if (subGeom instanceof LineString) {
	                                  sum += length3D((LineString) subGeom);
	                           }
	                   }
	                   return sum;
	           }
	  
	           public static double length3D(LineString lineString) {
	                  return length3D(lineString.getCoordinateSequence());
	        }

	public static double length3D(Polygon polygon) {
	                double len = 0.0;
                len += length3D(polygon.getExteriorRing().getCoordinateSequence());
	                for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
	                         len += length3D(polygon.getInteriorRingN(i));
	                 }
	                 return len;
	        }
}
