package com.altvil.aro.service.network.model;

import com.altvil.interfaces.RoadEdge;

import java.io.Serializable;
import java.util.Collection;


public class ServiceAreaRoadEdges implements Serializable {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	Collection<RoadEdge> roadEdges;

    public ServiceAreaRoadEdges(Collection<RoadEdge> roadEdges) {
        this.roadEdges = roadEdges;
    }

    public Collection<RoadEdge> getRoadEdges() {
        return roadEdges;
    }

    public void setRoadEdges(Collection<RoadEdge> roadEdges) {
        this.roadEdges = roadEdges;
    }
}
