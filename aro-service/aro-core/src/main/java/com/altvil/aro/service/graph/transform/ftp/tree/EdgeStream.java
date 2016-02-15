package com.altvil.aro.service.graph.transform.ftp.tree;

import java.util.List;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.EdgeList;

public interface EdgeStream extends LocationStream {

	
	public EdgeList getEdgeList() ;
	
	public GeoSegment getGeoSegment();
	
	public int indexOfDemand(double demand) ;
	
	public EdgeStream truncateTo(int endIndexExc) ;
	
	public EdgeStream truncateFrom(int startIndex) ;

	public List<GraphEdgeAssignment> getPinnedLocations();

	public VertexStream getVertexStream();


}
