package com.altvil.aro.service.graph.node;

import com.vividsolutions.jts.geom.Point;

public interface GraphNodeFactory {

	public SpliceNode createSpliceNode(Long id, Point point);
	
	public RoadNode createRoadNode(Long id, Point point);

	public LocationNode createLocationNode(Long id, Point point, long locationId);

	public FDTNode createFDTNode(Long id, Point point);
	
	public FDHNode createFDHNode(Long id, Point point) ;

}
