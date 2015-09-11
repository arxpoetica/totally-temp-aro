package com.altvil.aro.service.plan.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.dao.Accessor;
import com.altvil.aro.service.dao.DAOService;
import com.altvil.aro.service.dao.generic.AroDAO;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.GraphService;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.FDHAssignments;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.plan.DefaultRecalcRequest;
import com.altvil.aro.service.plan.PlanException;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.plan.RecalcRequest;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.googlecode.genericdao.search.Search;

@Singleton
public class PlanServiceImpl implements PlanService {

	private GraphService graphService;
	private Accessor<AroDAO<NetworkNode>> dao;
	private GraphTransformerFactory transformFactory;

	private Set<NetworkNodeType> computedNodeTypes = EnumSet.of(
			NetworkNodeType.fiber_distribution_terminal,
			NetworkNodeType.fiber_distribution_hub);

	private final Integer defaultFdtCount = 12;
	private final Integer defaultFdhCount = 220;

	@Inject
	public PlanServiceImpl(DAOService daoService, GraphService graphService,
			GraphTransformerFactory transformFactory) {
		super();
		this.graphService = graphService;
		dao = daoService.generic(NetworkNode.class);
		this.transformFactory = transformFactory;
	}

	@Override
	public Collection<NetworkNode> getNetworkNodes(long plan,
			Set<NetworkNodeType> types) throws PlanException {
		return dao.read(s -> s.search(searchByPlanTypes(plan, types)));
	}

	@Override
	public Collection<NetworkNode> computeNetworkNodes(int planId,
			NetworkNodeType type) throws PlanException {
		DefaultRecalcRequest req = new DefaultRecalcRequest() ;
		req.setPlanId(planId);
		return _computeNetworkNodes(wrap(req)) ;
	}

	@Override
	public Collection<NetworkNode> computeNetworkNodes(RecalcRequest request)
			throws PlanException {
		return _computeNetworkNodes(wrap(request)) ;
	}

	public Collection<NetworkNode> _computeNetworkNodes(RecalcRequest request)
			throws PlanException {
		GraphModel<AroEdge> gm = graphService.getGraphForPlanId(request
				.getPlanId());

		Collection<FDHAssignments> assigments = transformFactory
				.createFTTXTransformer(gm, request.getFdtCount(),
						request.getFdhCount()).apply(gm);

		Collection<NetworkNode> result = toNetworkNodes(assigments,
				request.getPlanId());

		dao.modify(d -> {
			d.delete(searchByPlanType(request.getPlanId(), computedNodeTypes));

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

	// private Search searchByPlanType(long planId, NetworkNodeType type) {
	// return new Search().addFilterEqual("routeId", planId).addFilterEqual(
	// "nodeTypeId", type.getId());
	// }

	private Search searchByPlanType(long planId, Set<NetworkNodeType> types) {
		return new Search().addFilterEqual("routeId", planId)
				.addFilterIn(
						"nodeTypeId",
						types.stream().map(t -> t.getId())
								.collect(Collectors.toList()));
	}

	private Search searchByPlanTypes(long planId, Set<NetworkNodeType> types) {
		return new Search().addFilterEqual("routeId", planId).addFilterIn(
				"nodeTypeId", toIds(types));
	}

	public Collection<NetworkNode> toNetworkNodes(
			Collection<FDHAssignments> assigments, long planId) {
		List<NetworkNode> result = new ArrayList<>();

		assigments
				.forEach(a -> {

					result.add(toNetworkNode(a.getFDHNode(),
							NetworkNodeType.fiber_distribution_hub.getId(),
							planId));
					result.addAll(a
							.getFdtNodes()
							.stream()
							.map(fdt -> toNetworkNode(fdt,
									NetworkNodeType.fiber_distribution_terminal
											.getId(), planId))
							.collect(Collectors.toList()));
				});

		return result;
	}

	private RecalcRequest wrap(RecalcRequest request) {
		return new RecalcRequest() {
			@Override
			public int getPlanId() {
				return request.getPlanId();
			}

			@Override
			public Integer getFdtCount() {
				return request.getFdtCount() == null ? defaultFdtCount
						: request.getFdtCount();
			}

			@Override
			public Integer getFdhCount() {
				return request.getFdhCount() == null ? defaultFdhCount
						: request.getFdhCount();
			}
		};
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
