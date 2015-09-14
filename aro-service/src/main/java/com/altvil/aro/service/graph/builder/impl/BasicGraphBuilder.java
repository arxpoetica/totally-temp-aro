package com.altvil.aro.service.graph.builder.impl;

import java.util.HashMap;
import java.util.Map;

import org.jgrapht.EdgeFactory;
import org.jgrapht.graph.SimpleDirectedWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.dao.graph.GraphEdge;
import com.altvil.aro.service.dao.graph.impl.GraphModelImpl;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphException;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.AroGraphModelBuilder;
import com.altvil.aro.service.graph.impl.AroEdgeFactory;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.node.impl.LocationNodeImpl;

public class BasicGraphBuilder implements AroGraphModelBuilder<GraphEdge> {

	private static final Logger log = LoggerFactory
			.getLogger(BasicGraphBuilder.class.getName());

	private GraphNodeFactory nodeFactory;

	
	private Map<Long, GraphNode> mapNodeById = new HashMap<Long, GraphNode>(
			1000);

	private SimpleDirectedWeightedGraph<GraphNode, AroEdge> graph = new SimpleDirectedWeightedGraph<GraphNode, AroEdge>(
			AroEdgeFactory.FACTORY);

	private EdgeFactory<GraphNode, AroEdge> edgeFactory = graph
			.getEdgeFactory();

	private GraphNode root;

	public BasicGraphBuilder(GraphNodeFactory nodeFactory) {
		this.nodeFactory = nodeFactory;
	}

	@Override
	public BasicGraphBuilder apply(GraphEdge edge) {

		try {
			Long srcNodeId = edge.getSource();
			GraphNode srcNode = mapNodeById.get(srcNodeId);
			boolean addSourceVertix = false;

			if (srcNode == null) {
				srcNode = createSourceNode(edge);
				mapNodeById.put(srcNode.getId(), srcNode);
				addSourceVertix = true;
				graph.addVertex(srcNode);
			}

			Long targetNodeId = edge.getTarget();
			GraphNode targetNode = mapNodeById.get(targetNodeId);

			boolean addTargetVertix = false;

			if (targetNode == null) {
				targetNode = createTargetNode(edge);
				mapNodeById.put(targetNode.getId(), targetNode);
				addTargetVertix = true;
			}

			if (!targetNode.isLocationNode()) {

				if (addTargetVertix) {
					graph.addVertex(targetNode);
				}

				if (srcNode.isLocationNode()) {
					targetNode.addLocation(srcNode);

				} else {
					if (addSourceVertix) {
						graph.addVertex(srcNode);
					}
					add(srcNode, targetNode, edge);
				}
			} else {
				targetNode.addLocation(srcNode);
				if( log.isWarnEnabled() ) log.warn("Inavlid Target Location " + targetNode);
			}

		} catch (Throwable err) {
			log.error(err.getMessage(), err);
		}

		return this;
	}

	private void add(GraphNode src, GraphNode target, GraphEdge edge) {

		if (log.isTraceEnabled()) {
			log.trace(src.getId() + "->" + target.getId() + " length= "
					+ edge.getEdgeLength() + " type=" + edge.getEdgeType());
		}

		AroEdge ae = edgeFactory.createEdge(src, target);
		graph.addEdge(src, target, ae);
		graph.setEdgeWeight(ae, edge.getEdgeLength());
		ae.setGid(edge.getGID());

	}

	private GraphNode createSourceNode(GraphEdge edge) throws GraphException {

		switch (edge.getEdgeType()) {
		case NETWORK_NODE_LINK:
			break;
		case ROAD_SEGMENT_LINK:
		case UNDEFINED_LINK:
			return nodeFactory.createRoadNode(edge.getSource(),
					edge.getStartPoint());
		case LOCATION_LINK:
			return new LocationNodeImpl(edge.getSource(), edge.getStartPoint(),
					edge.getLocationId());
		}

		throw new GraphException("Invalid source type " + edge.getEdgeType());
	}

	private GraphNode createTargetNode(GraphEdge edge) throws GraphException {

		switch (edge.getEdgeType()) {
		case NETWORK_NODE_LINK:
			return root = nodeFactory.createSpliceNode(edge.getSource(),
					edge.getEndPoint());
		case ROAD_SEGMENT_LINK:
		case UNDEFINED_LINK:
			return nodeFactory.createRoadNode(edge.getTarget(),
					edge.getStartPoint());

		case LOCATION_LINK:
			return new LocationNodeImpl(edge.getTarget(), edge.getEndPoint(),
					edge.getLocationId());
		}

		throw new GraphException("Invalid target type " + edge.getEdgeType());
	}

	@Override
	public GraphModel<AroEdge> build() {
		return new GraphModelImpl<AroEdge>(graph, root);
	}

}
