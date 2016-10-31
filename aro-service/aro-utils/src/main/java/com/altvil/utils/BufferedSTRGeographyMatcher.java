package com.altvil.utils;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.index.strtree.STRtree;

public class BufferedSTRGeographyMatcher {
    private final STRtree stRtree;

    @SuppressWarnings("unused")
	private final Logger log = LoggerFactory.getLogger(BufferedSTRGeographyMatcher.class.getName());

    public <T extends Geometry> BufferedSTRGeographyMatcher(Collection<T > geometries, double bufferDistance){

        Collection<T> geometriesFiltered = geometries.stream()
                .filter(geometry -> ! geometry.isEmpty())
                .collect(Collectors.toList());

        Point centroid = GeometryUtil.factory().buildGeometry(geometriesFiltered).getCentroid();
        Collection<T> geographies = GeometryUtil.transformGeometriesToGeographies(geometriesFiltered, centroid);
        List<Geometry> bufferedGeographies = geographies.stream()
                .map(geometry -> geometry.buffer(bufferDistance))
                .filter(geometry -> geometry != null && !geometry.isEmpty())
                .collect(Collectors.toList());

        Collection<Geometry> bufferedGeometries = GeometryUtil.transformGeographiesToGeometries(bufferedGeographies, centroid);


        this.stRtree = new STRtree();
        bufferedGeometries.forEach(geom -> stRtree.insert(geom.getEnvelopeInternal(), geom));
        stRtree.build();





    }


    @SuppressWarnings("unchecked")
	public boolean covers(Geometry geometry){


        return ((List<Geometry>) stRtree.query(geometry.getEnvelopeInternal()))
                .stream()
                .filter( testedGeom -> testedGeom.covers(geometry))
                .findAny()
                .isPresent();

    }

}
