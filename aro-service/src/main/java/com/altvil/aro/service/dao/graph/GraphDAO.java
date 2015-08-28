package com.altvil.aro.service.dao.graph;

import java.util.Collection;

import com.altvil.aro.model.GraphModel;
import com.altvil.aro.service.dao.DAOException;
import com.altvil.aro.service.dao.generic.GenericAroDAO;

public interface GraphDAO extends GenericAroDAO<GraphModel, Long> {

	public  Collection<GraphEdge> findNodesForPlanId(long planId) throws DAOException;

}
