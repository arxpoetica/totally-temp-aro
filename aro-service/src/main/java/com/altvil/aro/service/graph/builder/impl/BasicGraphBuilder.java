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

	private SimpleDirectedWeightedGraph<GraphNode, AroEdge<Long>> graph = new SimpleDirectedWeightedGraph<GraphNode, AroEdge<Long>>(
			new AroEdgeFactory<Long>());

	private EdgeFactory<GraphNode, AroEdge<Long>> edgeFactory = graph
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
			boolean addSourceVertix = srcNode == null;

			if (addSourceVertix) {
				srcNode = createSourceNode(edge);
				mapNodeById.put(srcNode.getId(), srcNode);
			}

			Long targetNodeId = edge.getTarget();
			GraphNode targetNode = mapNodeById.get(targetNodeId);
			boolean addTargetVertix = targetNode == null;

			if (addTargetVertix) {
				targetNode = createTargetNode(edge);
				mapNodeById.put(targetNode.getId(), targetNode);
			}

			if (targetNode.isLocationNode()) {

				if (srcNode.isLocationNode()) {
					targetNode.addLocation(srcNode);
					if (log.isWarnEnabled())
						log.warn("Location linked to location " + targetNode);
				} else {
					if (log.isWarnEnabled())
						log.warn("Intersection -> Location" + targetNode);

					add(addTargetVertix, addSourceVertix, edge, targetNode,
							srcNode);
				}

			} else {
				add(addSourceVertix, addTargetVertix, edge, srcNode, targetNode);

			}

		} catch (Throwable err) {
			log.error(err.getMessage(), err);
		}

		return this;
	}

	private void add(boolean addSourceVertix, boolean addTargetVertix,
			GraphEdge edge, GraphNode srcNode, GraphNode targetNode) {
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
	}

	private void add(GraphNode src, GraphNode target, GraphEdge edge) {

		if (log.isTraceEnabled()) {
			log.trace(src.getId() + "->" + target.getId() + " length= "
					+ edge.getEdgeLength() + " type=" + edge.getEdgeType());
		}

		AroEdge<Long> ae = edgeFactory.createEdge(src, target);
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
			return nodeFactory.createRoadNode(edge.getSource(), edge.getStartPoint()) ;
			
		}

		throw new GraphException("Invalid target type " + edge.getEdgeType());
	}

	@Override
	public GraphModel<Long> build() {
		return new GraphModelImpl<Long>(graph, root);
	}

}
