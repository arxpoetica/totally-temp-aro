package com.altvil.aro.service.dao.graph;

import com.vividsolutions.jts.geom.Point;

public class GraphVertex {
	
	private Long vertexId ;
	private Point point ;
	public GraphVertex(Long vertexId, Point point) {
		super();
		this.vertexId = vertexId;
		this.point = point;
	}
	public Long getVertexId() {
		return vertexId;
	}
	public Point getPoint() {
		return point;
	}
	
	

}
