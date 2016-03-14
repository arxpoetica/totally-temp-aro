package com.altvil.aro.service.graph;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface GraphService {

	/**
	 * 
	 * @param planId
	 * @return
	 * @throws GraphException
	 */
	public GraphModel<GeoSegment> getGraphForWireCenter(int planId)
			throws GraphException;
	
	
	public GraphModel<GeoSegment> getGraphForWireCenter(NetworkData networkData)
			throws GraphException;

}
