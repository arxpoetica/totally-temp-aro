package com.altvil.interfaces;

import com.vividsolutions.jts.geom.Point;

/**
 * Created by kwysocki on 19.11.15.
 */
public interface RoadLocation extends GraphPoint {

    long getId();

    Point getLocationPoint();

}
