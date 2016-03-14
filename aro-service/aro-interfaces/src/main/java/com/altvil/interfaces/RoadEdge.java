package com.altvil.interfaces;

import com.vividsolutions.jts.geom.Geometry;

/**
 * Created by kwysocki on 19.11.15.
 */
public interface RoadEdge {
    long getId();

    long getTindf();

    long getTnidt();

    Geometry getShape();

    double getLengthMeters();

    long getTlid();
}
