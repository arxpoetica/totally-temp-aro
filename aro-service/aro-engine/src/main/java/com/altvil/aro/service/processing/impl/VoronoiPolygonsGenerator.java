package com.altvil.aro.service.processing.impl;

import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.*;
import com.vividsolutions.jts.triangulate.VoronoiDiagramBuilder;

import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.altvil.utils.GeometryUtil.asCoordinates;
import static com.altvil.utils.GeometryUtil.factory;

public class VoronoiPolygonsGenerator {


    private double maxDistanceMeters;

    public VoronoiPolygonsGenerator(double maxDistanceMeters) {
        this.maxDistanceMeters = maxDistanceMeters;
    }

    public Collection<Polygon> generatePolygons(Collection<Point> points ){

        VoronoiDiagramBuilder diagramBuilder = new VoronoiDiagramBuilder();

        diagramBuilder.setSites(asCoordinates(points));
        diagramBuilder.setClipEnvelope(computeEnvelope(points));

        Geometry diagram = diagramBuilder.getDiagram(factory());

        return IntStream.range(0, diagram.getNumGeometries())
                .mapToObj(diagram::getGeometryN)
                .map(geometry -> (Polygon) geometry)
                .collect(Collectors.toList());


    }

    private Envelope computeEnvelope(Collection<Point> points) {
    	GeometryUtil.factory().buildGeometry(points).buffer(maxDistanceMeters) ;
    	return null;
    }
}
