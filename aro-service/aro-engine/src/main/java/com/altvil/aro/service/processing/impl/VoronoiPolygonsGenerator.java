package com.altvil.aro.service.processing.impl;

import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.algorithm.CentroidPoint;
import com.vividsolutions.jts.geom.*;
import com.vividsolutions.jts.triangulate.VoronoiDiagramBuilder;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.altvil.utils.GeometryUtil.*;

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
        diagramBuilder.setClipEnvelope(computeEnvelope(points));

        Geometry diagram = diagramBuilder.getDiagram(factory());

        Geometry clipper = GeometryUtil.factory().createMultiPoint(points.toArray(new Point[0])).buffer(maxDistanceMeters);

        Geometry intersectedDiagram = diagram.intersection(clipper);

        return IntStream.range(0, intersectedDiagram.getNumGeometries())
                .mapToObj(diagram::getGeometryN)
                .map(geometry -> (Polygon) geometry)
                .collect(Collectors.toList());


    }

    private Envelope computeEnvelope(Collection<Point> points) {

    	return GeometryUtil
                .factory()
                .buildGeometry(points)
                .buffer(maxDistanceMeters)
                .getEnvelopeInternal();
    }
}
