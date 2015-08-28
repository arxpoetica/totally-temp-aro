package com.altvil.aro.service.dao.graph;

import com.vividsolutions.jts.geom.Point;


public interface GraphEdge {

	public Long getId();

	public Long getSource();

	public Long getTarget();

	public Long getGID();

	public EdgeType getEdgeType();

	public double getEdgeLength();

	public Object getGeom();

	public Point getStartPoint();

	public Point getEndPoint();

	public Long getLocationId();

}
