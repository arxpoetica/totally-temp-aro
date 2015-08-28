package com.altvil.aro.service.dao.graph;

public class EdgeTypeMapping {

	public static final EdgeTypeMapping MAPPING = new EdgeTypeMapping() ;
	
	private EdgeType[] map;

	private EdgeTypeMapping() {
		init() ;
	}
	
	private void init() {
		map = new EdgeType[EdgeType.values().length] ;
		for(EdgeType t : EdgeType.values()) {
			map[t.getCode()] = t ;
		}
	}

	public EdgeType getEdgeType(int code) {
		return map[code < map.length ? code : 0];
	}

}
