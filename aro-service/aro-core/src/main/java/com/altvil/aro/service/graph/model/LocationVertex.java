package com.altvil.aro.service.graph.model;




public class LocationVertex {

	private Long vertexId;
	private long locationId;
	
	public LocationVertex(Long vertexId, long locationId) {
		super();
		this.vertexId = vertexId;
		this.locationId = locationId;
	}

	public Long getVertexId() {
		return vertexId;
	}

	public long getLocationId() {
		return locationId;
	}

}
