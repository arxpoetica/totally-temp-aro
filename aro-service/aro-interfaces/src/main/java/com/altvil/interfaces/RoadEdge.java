package com.altvil.interfaces;

import com.vividsolutions.jts.geom.Geometry;

import java.io.Serializable;

/**
 * Created by kwysocki on 19.11.15.
 */
public interface RoadEdge extends Serializable{
    long getId();

    long getTindf();

    long getTnidt();

    Geometry getShape();

    double getLengthMeters();

    long getTlid();
}
