package com.altvil.interfaces;

import com.vividsolutions.jts.geom.Point;


public interface GraphPoint {


    long getRoadSegmentId();

    double getRoadSegmentPositionRatio();

    Point getRoadSegmentClosestPoint();

    double getDistanceFromRoadSegmentInMeters();

    long getTlid();
}
