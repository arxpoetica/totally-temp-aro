package com.altvil.interfaces;


import com.vividsolutions.jts.geom.Point;

public interface EquipmentLocation extends GraphPoint {

	Long getObjectId() ;
    Point getCoordinates();
}
