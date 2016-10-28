package com.altvil.utils;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.prep.PreparedGeometry;
import com.vividsolutions.jts.geom.prep.PreparedGeometryFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BufferedGeographyMatcher {
    PreparedGeometry preparedGeometry;
    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    public <T extends Geometry> BufferedGeographyMatcher(Collection<T > geometries, double bufferDistance){

        Collection<T> geometriesFiltered = geometries.stream()
                .filter(geometry -> ! geometry.isEmpty())
                .collect(Collectors.toList());

        Point centroid = GeometryUtil.factory().buildGeometry(geometriesFiltered).getCentroid();
        Collection<T> geographies = GeometryUtil.transformGeometriesToGeographies(geometriesFiltered, centroid);
        List<Geometry> bufferedGeographies = geographies.stream()
                .map(geometry -> geometry.buffer(bufferDistance))
                .flatMap(geometry -> {
                            if (geometry instanceof MultiPolygon) {
                                return IntStream.range(0, geometry.getNumGeometries())
                                        .mapToObj(geometry::getGeometryN);
                            }
                            if (geometry instanceof Polygon) {
                                return Stream.of(geometry);
                            }
                            log.warn("Geometry type " + geometry.getClass().getName() + " was skipped ");
                            return Stream.empty();
                        }
                )
                .filter(geometry -> geometry != null && !geometry.isEmpty())
                .collect(Collectors.toList());

        Collection<Geometry> bufferedGeometries = GeometryUtil.transformGeographiesToGeometries(bufferedGeographies, centroid);
        preparedGeometry = PreparedGeometryFactory.prepare(GeometryUtil.factory().buildGeometry(bufferedGeometries));

    }


    public boolean covers(Geometry geometry){
        return preparedGeometry.covers(geometry);
    }

}
