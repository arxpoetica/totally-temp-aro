package com.altvil.aro.service.graph.model;

import java.io.Serializable;
import java.util.Collection;

import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.RoadEdge;

@SuppressWarnings("serial")
public class EdgeData implements Serializable {

	private Collection<RoadEdge> roadEdges;
	private Collection<CableConduitEdge> cableConduitEdges;

	public Collection<RoadEdge> getRoadEdges() {
		return roadEdges;
	}

	public void setRoadEdges(Collection<RoadEdge> roadEdges) {
		this.roadEdges = roadEdges;
	}

	public Collection<CableConduitEdge> getCableConduitEdges() {
		return cableConduitEdges;
	}

	public void setCableConduitEdges(
			Collection<CableConduitEdge> cableConduitEdges) {
		this.cableConduitEdges = cableConduitEdges;
	}

}
