package com.altvil.utils;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.prep.PreparedGeometry;
import com.vividsolutions.jts.geom.prep.PreparedGeometryFactory;

public class BufferedGeographyMatcher {
    PreparedGeometry preparedGeometry;

    public <T extends Geometry> BufferedGeographyMatcher(Collection<T > geometries, double bufferDistance){

        Collection<T> geometriesFiltered = geometries.stream()
                .filter(geometry -> ! geometry.isEmpty())
                .collect(Collectors.toList());

        Point centroid = GeometryUtil.factory().buildGeometry(geometriesFiltered).getCentroid();
        Collection<T> geographies = GeometryUtil.transformGeometriesToGeographies(geometriesFiltered, centroid);
        List<Geometry> bufferedGeographies = geographies.stream()
                .map(geometry -> geometry.buffer(bufferDistance))
                .map(geometry -> {
                            if (geometry instanceof MultiPolygon) {
                                return geometry;
                            } if (geometry instanceof Polygon) {
                                return GeometryUtil.factory().createMultiPolygon(new Polygon[]{(Polygon) geometry});
                            }
                            return null;
                        }
                )
                .filter(geometry -> geometry != null && ! geometry.isEmpty())
                .collect(Collectors.toList());

        Collection<Geometry> bufferedGeometries = GeometryUtil.transformGeographiesToGeometries(bufferedGeographies, centroid);
        preparedGeometry = PreparedGeometryFactory.prepare(GeometryUtil.factory().buildGeometry(bufferedGeometries));

    }


    public boolean covers(Geometry geometry){
        return preparedGeometry.covers(geometry);
    }

}
