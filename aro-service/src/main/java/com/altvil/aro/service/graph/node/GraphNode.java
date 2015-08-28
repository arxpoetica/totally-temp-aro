package com.altvil.aro.service.graph.node;

import com.vividsolutions.jts.geom.Point;

public interface GraphNode {
	
	public void accept(GraphNodeVisitor visitor) ;
	
	public Long getId() ;
	public Point getPoint() ;
	
	public boolean isLocationNode() ;
	
	public GraphNode getLocationNode() ;
	public void addLocation(GraphNode node) ;
	public boolean isConnectedToLocationNode() ;
	

}
