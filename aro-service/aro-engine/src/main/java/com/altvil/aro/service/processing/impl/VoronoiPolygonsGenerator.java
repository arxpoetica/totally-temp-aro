package com.altvil.aro.service.processing.impl;

import static com.altvil.utils.GeometryUtil.asCoordinates;
import static com.altvil.utils.GeometryUtil.factory;
import static com.altvil.utils.GeometryUtil.transformGeographiesToGeometries;
import static com.altvil.utils.GeometryUtil.transformGeometriesToGeographies;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.triangulate.VoronoiDiagramBuilder;

public class VoronoiPolygonsGenerator {


    private double maxDistanceMeters;

    public VoronoiPolygonsGenerator(double maxDistanceMeters) {
        this.maxDistanceMeters = maxDistanceMeters;
    }


    public Collection<Polygon> generatePolygons(Collection<Point> points){
        if(points.isEmpty())
            return Collections.emptyList();
        Point[] pointsArr = points.toArray(new Point[points.size()]);
        Point centroid = GeometryUtil.factory().createMultiPoint(pointsArr).getCentroid();
        return transformGeographiesToGeometries(
                    generatePolygonsMeters(
                        transformGeometriesToGeographies(points, centroid)),
                centroid);
    }

    private Collection<Polygon> generatePolygonsMeters(Collection<Point> points){

        VoronoiDiagramBuilder diagramBuilder = new VoronoiDiagramBuilder();

        diagramBuilder.setSites(asCoordinates(points));
       // diagramBuilder.setClipEnvelope(computeEnvelope(points));

        Geometry diagram = diagramBuilder.getDiagram(factory());

        Geometry clipper = GeometryUtil
                .factory()
                .createMultiPoint(points.toArray(new Point[0]))
                .buffer(maxDistanceMeters);

        return IntStream.range(0, diagram.getNumGeometries())
                .mapToObj(diagram::getGeometryN)
                .map(geometry -> geometry.intersection(clipper))
                .map(geometry -> (Polygon) geometry)
                .collect(Collectors.toList());


    }

//    private Envelope computeEnvelope(Collection<Point> points) {
//
//    	return GeometryUtil
//                .factory()
//                .buildGeometry(points)
//                .buffer(maxDistanceMeters)
//                .getEnvelopeInternal();
//    }
}
