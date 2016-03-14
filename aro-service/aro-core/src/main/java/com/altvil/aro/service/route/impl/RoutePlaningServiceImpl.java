package com.altvil.aro.service.route.impl;

import java.util.Collection;
import java.util.Map;

import org.jgrapht.WeightedGraph;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.RouteBuilder;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.impl.AroEdgeFactory;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.network.NetworkBuilder;
import com.altvil.aro.service.route.RouteModel;
import com.altvil.aro.service.route.RouteNetworkData;
import com.altvil.aro.service.route.RoutePlaningService;
import com.altvil.aro.service.route.RoutingOptions;
import com.altvil.interfaces.Assignment;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;
import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import com.google.inject.Singleton;

@Service
@Singleton
public class RoutePlaningServiceImpl implements RoutePlaningService {

	private static final Logger log = LoggerFactory
			.getLogger(RoutePlaningServiceImpl.class.getName());

	// private EntityFactory entityFactory = EntityFactory.FACTORY;
	private GraphTransformerFactory transformFactory;
	private GraphNodeFactory vertexFactory;

	@Autowired
	public RoutePlaningServiceImpl(GraphTransformerFactory transformFactory,
			GraphNodeFactory vertexFactory) {
		super();
		this.transformFactory = transformFactory;
		this.vertexFactory = vertexFactory;
	}

	@Override
	public RouteModel createRouteModel(RouteNetworkData routeData,
			RoutingOptions options) {

		GraphNetworkModel model = transformFactory.createGraphNetworkModel(
				routeData.getRoadEdges(), routeData.getNetworkAssignments());

		return renodeGraph(model, model.getGraphAssignments());
	}

	@Override
	public RouteModel planRoute(GraphNetworkModel networkModel) {
		return renodeGraph(networkModel, networkModel.getGraphAssignments());
	}

	private RouteModel renodeGraph(GraphNetworkModel graphNetworkModel,
			Collection<GraphEdgeAssignment> edgeAssigments) {

		if (log.isDebugEnabled())
			log.debug("renode  Graph for all assigned equipment");

		GraphModelBuilder<GeoSegment> b = transformFactory
				.createBuilder(new SimpleWeightedGraph<GraphNode, AroEdge<GeoSegment>>(
						new AroEdgeFactory<GeoSegment>()));

		NetworkBuilder networkBuilder = new NetworkBuilder(b, vertexFactory);
		edgeAssigments.forEach(a -> {
			networkBuilder.add(a); // Assignments
			});

		networkBuilder.renodeGraph(graphNetworkModel.getGraphModel());
		Map<GraphAssignment, GraphNode> resolved = networkBuilder
				.getResolvedAssignments();

		return new DefaultNodedModel(graphNetworkModel, networkBuilder
				.getBuilder().build(), resolved);

	}

	private static class DefaultNodedModel implements RouteModel {

		private GraphNetworkModel graphModel;
		private GraphModel<GeoSegment> model;
		private Map<GraphAssignment, GraphNode> resolved;
		private Multimap<GraphNode, NetworkAssignment> vertexToAssignments ;

		public DefaultNodedModel(GraphNetworkModel graphModel,
				GraphModel<GeoSegment> model,
				Map<GraphAssignment, GraphNode> resolved) {
			super();
			this.graphModel = graphModel;
			this.model = model;
			this.resolved = resolved;
		}
		
		
		private  Multimap<GraphNode, NetworkAssignment> getVertexToAssignments() {
			if( vertexToAssignments == null ) {
				vertexToAssignments = ArrayListMultimap.create() ;
				graphModel.getNetworkAssignments().forEach(a -> {
					vertexToAssignments.put(getVertex(a), a) ;
				});
			}
			
			return vertexToAssignments ;
		}
		

		@Override
		public Collection<NetworkAssignment> getNetworkAssignments(
				GraphNode graphNode) {
			return getVertexToAssignments().get(graphNode) ;
		}

		@Override
		public Collection<GraphNode> getVertices(
				Collection<NetworkAssignment> networkAssignments) {
			return StreamUtil.map(networkAssignments, this::getVertex);
		}

		@SuppressWarnings({ "rawtypes", "unchecked" })
		@Override
		public Collection<AroEdge<GeoSegment>> planRoute(GraphNode src,
				Collection<GraphNode> targets) {
			return new RouteBuilder<GraphNode, AroEdge<GeoSegment>>().build(
					(WeightedGraph) getModel().getGraph(), src, targets);
		}
		

		@SuppressWarnings({ "unchecked", "rawtypes" })
		@Override
		public Collection<SourceRoute<GraphNode,AroEdge<GeoSegment>>> planRoute(
				Collection<GraphNode> sources, Collection<GraphNode> targets) {
			return new RouteBuilder<GraphNode, AroEdge<GeoSegment>>().build(
					(WeightedGraph) getModel().getGraph(), sources, targets);
		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see com.altvil.aro.service.route.impl.NodedModel#getModel()
		 */
		@Override
		public GraphModel<GeoSegment> getModel() {
			return model;
		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see
		 * com.altvil.aro.service.route.impl.NodedModel#getVertex(com.altvil
		 * .interfaces.NetworkAssignment)
		 */
		@Override
		public GraphNode getVertex(NetworkAssignment networkAssignment) {
			return getVertex(graphModel
					.getGraphEdgeAssignment(networkAssignment));
		}

		private PinnedLocation remapPin(GraphNode vertex,
				PinnedLocation originalPin) {

			GeoSegment gs = originalPin.getGeoSegment();

			// find all edges for assigned vertex
			for (AroEdge<GeoSegment> e : model.getGraph().edgesOf(vertex)) {
				if (e.getValue().getGid() == gs.getGid()) {
					return e.getValue().pinLocation(originalPin);
				}
			}

			throw new RuntimeException("Failed remap pin "
					+ originalPin.toString() + " on vertex " + vertex);
		}

		@Override
		public Assignment<GraphEdgeAssignment, GraphNode> createEdgeAssignment(
				NetworkAssignment networkAssignment) {

			GraphNode vertex = getVertex(networkAssignment);
			GraphEdgeAssignment originalEdgeAssignment = graphModel
					.getGraphEdgeAssignment(networkAssignment);

			GraphEdgeAssignment newAssignment = GraphAssignmentFactoryImpl.FACTORY
					.createEdgeAssignment(
							remapPin(vertex,
									originalEdgeAssignment.getPinnedLocation()),
							originalEdgeAssignment.getAroEntity());

			return new Assignment<GraphEdgeAssignment, GraphNode>() {

				@Override
				public GraphEdgeAssignment getSource() {
					return newAssignment;
				}

				@Override
				public GraphNode getDomain() {
					return vertex;
				}

			};

		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see
		 * com.altvil.aro.service.route.impl.NodedModel#getVertex(com.altvil
		 * .aro.service.graph.assigment.GraphAssignment)
		 */
		@Override
		public GraphNode getVertex(GraphAssignment a) {
			return resolved.get(a);
		}

	}

}
