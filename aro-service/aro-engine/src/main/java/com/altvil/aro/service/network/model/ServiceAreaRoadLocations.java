package com.altvil.aro.service.network.model;

import com.altvil.interfaces.RoadLocation;

import java.io.Serializable;
import java.util.Map;

public class ServiceAreaRoadLocations implements Serializable {
    Map<Long, RoadLocation> id2location;

    public ServiceAreaRoadLocations(Map<Long, RoadLocation> id2location) {
        this.id2location = id2location;
    }

    public Map<Long, RoadLocation> getId2location() {
        return id2location;
    }
}


