package com.altvil.aro.service.plan;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;

public interface PlanService {

	/**
	 * 
	 * @param plan
	 * @param types
	 * @return
	 * @throws PlanException
	 */
	public Collection<NetworkNode> getNetworkNodes(long plan,
			Set<NetworkNodeType> types) throws PlanException;

	/**
	 * 
	 * @param plan
	 * @return FDT for a given Plan
	 * @throws PlanException
	 */
	public Collection<NetworkNode> computeNetworkNodes(long plan,
			NetworkNodeType type) throws PlanException;

	/**
	 * 
	 * @param planId
	 * @param nodes
	 * @return
	 */
	public void updateNetworkNodes(long planId, Collection<NetworkNode> nodes)
			throws PlanException;

	/**
	 * delete Fdts for given plan
	 * 
	 * @param planId
	 */
	public int deleteNetworkNodes(long planId, Set<NetworkNodeType> type)
			throws PlanException;

	

}
