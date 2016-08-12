package com.altvil.aro.service.network.model;

import java.io.Serializable;
import java.util.Collection;

import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.RoadEdge;

@SuppressWarnings("serial")
public class ServiceData implements Serializable {

	private Collection<RoadEdge> roadEdges;
	private Collection<CableConduitEdge> cableEdges;
	
	public ServiceData(Collection<RoadEdge> roadEdges,
			Collection<CableConduitEdge> cableEdges) {
		super();
		this.roadEdges = roadEdges;
		this.cableEdges = cableEdges;
	}

	public Collection<RoadEdge> getAllRoadEdges(Long planId) {
		return roadEdges;
	}

	public Collection<CableConduitEdge> getAllConduitEdges(Long planId) {
		return cableEdges;
	}

}
