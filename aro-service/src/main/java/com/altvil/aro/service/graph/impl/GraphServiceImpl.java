package com.altvil.aro.service.graph.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.dao.DAOService;
import com.altvil.aro.service.dao.graph.GraphDAO;
import com.altvil.aro.service.graph.GraphException;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.GraphService;
import com.altvil.aro.service.graph.builder.impl.BasicGraphBuilder;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Singleton
public class GraphServiceImpl implements GraphService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(GraphServiceImpl.class.getName());

	private DAOService daoService;
	private GraphNodeFactory nodeFactory;

	@Inject
	public GraphServiceImpl(DAOService daoService, GraphNodeFactory nodeFactory) {
		this.daoService = daoService;
		this.nodeFactory = nodeFactory;
	}

	@Override
	public GraphModel<Long> getGraphForPlanId(long planId)
			throws GraphException {
		try {
			return daoService.dao(GraphDAO.class).read(
					dao -> {
						return new BasicGraphBuilder(nodeFactory).build(dao
								.getGraphDataForPlanId(planId));
					});

		} catch (Throwable err) {
			throw new GraphException(err.getMessage(), err);
		}
	}

}
