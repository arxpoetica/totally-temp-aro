package com.altvil.aro.service.dao.graph;

public enum EdgeType {

	UNDEFINED_LINK(0),
	NETWORK_NODE_LINK(1),
	ROAD_SEGMENT_LINK(2),
	LOCATION_LINK(3)
	
	;
	private int code ;
	
	private EdgeType(int code) {
		this.code = code;
	}
	
	public int getCode() {
		return code ;
	}
	
}
