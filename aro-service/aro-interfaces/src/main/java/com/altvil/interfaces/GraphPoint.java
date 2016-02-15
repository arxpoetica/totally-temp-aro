package com.altvil.interfaces;

import com.vividsolutions.jts.geom.Point;

/**
 * Created by kwysocki on 20.11.15.
 */
public interface GraphPoint {


    long getRoadSegmentId();

    double getRoadSegmentPositionRatio();

    Point getRoadSegmentClosestPoint();

    double getDistanceFromRoadSegmentInMeters();

    long getTlid();
}
