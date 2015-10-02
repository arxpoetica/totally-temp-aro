package com.altvil.aro.service.graph.builder.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.jgrapht.EdgeFactory;
import org.jgrapht.graph.SimpleDirectedWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.dao.graph.GraphData;
import com.altvil.aro.service.dao.graph.GraphEdge;
import com.altvil.aro.service.dao.graph.GraphVertex;
import com.altvil.aro.service.dao.graph.LocationVertex;
import com.altvil.aro.service.dao.graph.impl.GraphModelImpl;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphException;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.impl.AroEdgeFactory;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.vividsolutions.jts.geom.Point;

public class BasicGraphBuilder  {

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
	
	private Map<Long, GraphVertex> verticesMap ;
	private Map<Long, LocationVertex> locationVerticesMap ;

	public BasicGraphBuilder(GraphNodeFactory nodeFactory) {
		this.nodeFactory = nodeFactory;
	}
	
	public GraphModel<Long> build(GraphData graphData) {
		
		verticesMap = graphData.getGraphVertices().stream().collect(Collectors.toMap(v -> v.getVertexId(), v -> v)) ;
		locationVerticesMap = hash(graphData.getLocationVertices(), v -> v.getVertexId()) ;
		graphData.getGraphEdges().forEach(e -> apply(e));
		
		return new GraphModelImpl<Long>(graph, root);
	}
	
	private <K,T> Map<K,T> hash(Collection<T> values, Function<T, K> f) {
		Map<K, T> map = new HashMap<K, T>() ;
		values.forEach(v -> map.put(f.apply(v), v)); 
		return map ;
	}
	

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
	
	private Point getVertexPoint(Long vid) {
		return this.verticesMap.get(vid).getPoint() ;
	}

	private GraphNode createSourceNode(GraphEdge edge) throws GraphException {

		Long source = edge.getSource() ;
		Point point = getVertexPoint(source) ;
		
		
		switch (edge.getEdgeType()) {
		case NETWORK_NODE_LINK:
			break;
		case ROAD_SEGMENT_LINK:
		case UNDEFINED_LINK:
			return nodeFactory.createRoadNode(source, point);
		case LOCATION_LINK:
			LocationVertex lv = locationVerticesMap.get(source) ;
			if( lv == null ) {
				//Warn
				return nodeFactory.createRoadNode(source, point);
			}
			return nodeFactory.createLocationNode(source, point, lv.getLocationId()) ;
		}

		throw new GraphException("Invalid source type " + edge.getEdgeType());
	}

	private GraphNode createTargetNode(GraphEdge edge) throws GraphException {

		Long target = edge.getTarget() ;
		Point point = getVertexPoint(target) ;
		
		switch (edge.getEdgeType()) {
		case NETWORK_NODE_LINK:
			return root = nodeFactory.createSpliceNode(target,
					point);
		case ROAD_SEGMENT_LINK:
		case UNDEFINED_LINK:
			return nodeFactory.createRoadNode(edge.getTarget(),
					point);

		case LOCATION_LINK:
			LocationVertex lv = locationVerticesMap.get(target) ;
			if( lv == null ) {
				return nodeFactory.createRoadNode(target, point);
			}
			return nodeFactory.createLocationNode(target, point, lv.getLocationId()) ;
			
		}

		throw new GraphException("Invalid target type " + edge.getEdgeType());
	}

	

}
