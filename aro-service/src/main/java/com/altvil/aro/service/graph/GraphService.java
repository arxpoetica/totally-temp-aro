package com.altvil.aro.service.graph;


public interface GraphService {

	/**
	 * 
	 * @param planId
	 * @return
	 * @throws GraphException
	 */
	public GraphModel getGraphForPlanId(long planId) throws GraphException;

}
