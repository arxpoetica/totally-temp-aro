package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.dao.Accessor;
import com.altvil.aro.service.dao.DAOService;
import com.altvil.aro.service.dao.generic.AroDAO;
import com.altvil.aro.service.graph.GraphService;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.plan.PlanException;
import com.altvil.aro.service.plan.PlanService;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.googlecode.genericdao.search.Search;

@Singleton
public class PlanServiceImpl implements PlanService {

	private GraphService graphService;
	private Accessor<AroDAO<NetworkNode>> dao;
	private GraphTransformerFactory transformFactory;

	@Inject
	public PlanServiceImpl(DAOService daoService, GraphService graphService,
			GraphTransformerFactory transformFactory) {
		super();
		this.graphService = graphService;
		dao = daoService.generic(NetworkNode.class);
		this.transformFactory = transformFactory ;
	}

	@Override
	public Collection<NetworkNode> getNetworkNodes(long plan,
			Set<NetworkNodeType> types) throws PlanException {
		return dao.read(s -> s.search(searchByPlanTypes(plan, types)));
	}

	@Override
	public Collection<NetworkNode> computeNetworkNodes(long planId,
			NetworkNodeType type) throws PlanException {

		Collection<FDTNode> fdtNodes = transformFactory
				.createBasicFDTTransformer(10).apply(
						graphService.getGraphForPlanId(planId));

		Collection<NetworkNode> result = toNetworkNodes(fdtNodes, planId);

		dao.modify(d -> {
			d.delete(searchByPlanType(planId,
					NetworkNodeType.fiber_distribution_terminal));
			d.saveOrUpdate(result);
		});

		return result;
	}

	@Override
	public void updateNetworkNodes(long planId, Collection<NetworkNode> nodes)
			throws PlanException {
		dao.modify(s -> s.saveOrUpdate(nodes));

	}

	@Override
	public int deleteNetworkNodes(long planId, Set<NetworkNodeType> type)
			throws PlanException {
		return dao.returnResult(s -> s.delete(searchByPlanTypes(planId, type)));
	}

	private Collection<Integer> toIds(Set<NetworkNodeType> types) {
		return types.stream().map(t -> t.getId()).collect(Collectors.toList());
	}

	private Search searchByPlanType(long planId, NetworkNodeType type) {
		return new Search().addFilterEqual("routeId", planId).addFilterEqual(
				"nodeTypeId", type.getId());
	}

	private Search searchByPlanTypes(long planId, Set<NetworkNodeType> types) {
		return new Search().addFilterEqual("routeId", planId).addFilterIn(
				"nodeTypeId", toIds(types));
	}

	public Collection<NetworkNode> toNetworkNodes(Collection<FDTNode> ftds,
			long planId) {
		return ftds.stream().map(fdt -> toNetworkNode(fdt, 4, planId))
				.collect(Collectors.toList());
	}

	private NetworkNode toNetworkNode(GraphNode fdt, int typeId, long planId) {
		NetworkNode node = new NetworkNode();

		node.setGeogPoint(fdt.getPoint());
		node.setLongitude(fdt.getPoint().getX());
		node.setLattitude(fdt.getPoint().getY());
		node.setPoint(fdt.getPoint());
		node.setNodeTypeId(typeId);
		node.setGeogPoint(fdt.getPoint());
		node.setRouteId(planId);

		return node;
	}

}
