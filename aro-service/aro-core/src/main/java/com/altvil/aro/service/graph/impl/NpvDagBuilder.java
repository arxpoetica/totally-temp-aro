package com.altvil.aro.service.graph.impl;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.AllShortestPaths;
import com.altvil.aro.service.graph.alg.DAGPath;
import com.altvil.aro.service.graph.alg.GraphPathListener;
import com.altvil.aro.service.graph.alg.PathEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.model.Reversable;
import com.altvil.aro.service.graph.node.GraphNode;


//TODO Utilize this class with NPV (NOTE NPV should probably not be using a DAG)

public class NpvDagBuilder<T> implements GraphPathListener<GraphNode, AroEdge<T>>  {
	
	private static final Logger log = LoggerFactory
			.getLogger(DagBuilder.class.getName());
	
	private final GraphModelBuilder<T> dagBuilder;
	private final GraphModel<T> graphModel;

	private Set<AroEdge<T>> foundEdges = new HashSet<>();

	private final ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder;

	public NpvDagBuilder(GraphModelBuilder<T> dagBuilder, GraphModel<T> graphModel, ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder) {
		this.dagBuilder = dagBuilder;
		this.graphModel = graphModel;
		this.closestFirstSurfaceBuilder = closestFirstSurfaceBuilder;
	}

	public DAGModel<T> createDAG(Collection<GraphNode> targets, GraphNode src) {

		if( log.isDebugEnabled() ) log.debug("src vertex " + src);
		if( log.isDebugEnabled() ) log.debug("targets " + targets.size());
		
		
		if( targets.size() > 0 ) {
			final WeightedGraph<GraphNode, AroEdge<T>> graph = graphModel.getGraph();
			AllShortestPaths<GraphNode, AroEdge<T>> shortestPaths = new AllShortestPaths<GraphNode, AroEdge<T>>(
					graph, closestFirstSurfaceBuilder, src);
			
			// Find shortest (minimizes sum of path weights) path to each vertex.
			Collection<GraphNode> foundPaths = shortestPaths
					.findPathVertices(targets);
			
			if( log.isDebugEnabled() ) log.debug("found Paths " + foundPaths.size());
			
			Set<AroEdge<T>> knownEdges = new HashSet<>();
			int dagEdges = 0;
			while (!targets.isEmpty()) {
				Set<GraphNode> sources = new HashSet<GraphNode>();
				
				for(GraphNode target : targets) {
					AroEdge<T> spanningEdge = shortestPaths.getSpanningTreeEdge(target);
					
					if (spanningEdge != null && knownEdges.add(spanningEdge)) {
						final GraphNode source = Graphs.getOppositeVertex(graph, spanningEdge, target);
						addEdge(target, source, spanningEdge);
						dagEdges++;

						sources.add(source);
					}
				}
				
				targets = sources;
			}
			
			if( log.isDebugEnabled() ) log.debug("dagEdges " + dagEdges);
		}
		dagBuilder.setRoot(src);
		return dagBuilder.buildDAG();
	}

	public ClosestFirstSurfaceBuilder getClosestFirstSurfaceBuilder() {
		return closestFirstSurfaceBuilder;
	}

	@Override
	public boolean onPathFound(DAGPath<GraphNode, AroEdge<T>> path) {
		path.getPathEdges().forEach(e -> {

			AroEdge<T> edge = e.getEdge();

			if (!foundEdges.contains(edge)) {
				foundEdges.add(edge);
				add(e);
			}
		});

		return true;
	}

	
	@SuppressWarnings("unchecked")
	private void addEdge(GraphNode src, GraphNode target, AroEdge<T> e) {
		T val = e.getValue() ;
		
		if( val instanceof Reversable &&  !e.getSourceNode().equals(src) ) {
			val = (T) ((Reversable) val).reverse() ;
		}
		
		dagBuilder.add(src, target, val, e.getWeight()) ;
	}
	
	
	@SuppressWarnings("unchecked")
	private void add(PathEdge<GraphNode, AroEdge<T>> pathEdge) {

		if (pathEdge != null) {
			if (pathEdge.getSource().equals(pathEdge.getEdge().getSourceNode())) {
				dagBuilder.add(pathEdge.getSource(), pathEdge.getTarget(),
						pathEdge.getEdge().getValue(), pathEdge.getEdge()
								.getWeight());

			} else {
				T value = pathEdge.getEdge().getValue();
				if (value instanceof Reversable) {
					value = (T) ((Reversable) value).reverse();
				}
				dagBuilder.add(pathEdge.getSource(), pathEdge.getTarget(),
						value, pathEdge.getEdge().getWeight());

			}
		}
	}

}
