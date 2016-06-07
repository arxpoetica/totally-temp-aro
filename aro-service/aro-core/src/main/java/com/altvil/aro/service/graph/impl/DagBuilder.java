package com.altvil.aro.service.graph.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

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

public class DagBuilder<T> implements GraphPathListener<GraphNode, AroEdge<T>> {

	private static final Logger log = LoggerFactory
			.getLogger(DagBuilder.class.getName());
	
	private final GraphModelBuilder<T> dagBuilder;
	private final GraphModel<T> graphModel;

	private Set<AroEdge<T>> foundEdges = new HashSet<>();
	private Set<GraphNode> vertices = new HashSet<>();
	private Set<AroEdge<T>> markedEdges = new HashSet<>();

	private final ClosestFirstSurfaceBuilder<GraphNode, AroEdge<T>> closestFirstSurfaceBuilder;

	public DagBuilder(GraphModelBuilder<T> dagBuilder, GraphModel<T> graphModel, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<T>> closestFirstSurfaceBuilder) {
		this.dagBuilder = dagBuilder;
		this.graphModel = graphModel;
		this.closestFirstSurfaceBuilder = closestFirstSurfaceBuilder;
	}

	public DAGModel<T> createDAG(double parametric, Function<AroEdge<T>, Set<GraphNode>> marked, GraphNode src) {

		if( log.isDebugEnabled() ) log.debug("src vertex " + src);
		
		
		for(AroEdge<T> edge : graphModel.getEdges()) {
			Set<GraphNode> markedVerticies = marked.apply(edge);
			
			if (!markedVerticies.isEmpty()) {
				markedEdges.add(edge);
				vertices.addAll(markedVerticies);
			}
		}
		
		if( log.isDebugEnabled() ) log.debug("marked edges " + vertices.size());
		
		dagBuilder.addVertex(src) ;
		
		if( markedEdges.size() > 0 ) {
			final WeightedGraph<GraphNode, AroEdge<T>> graph = graphModel.getGraph();
			AllShortestPaths<GraphNode, AroEdge<T>> shortestPaths = new AllShortestPaths<GraphNode, AroEdge<T>>(
					graph, closestFirstSurfaceBuilder, parametric, src);
			
			if( log.isDebugEnabled() ) log.debug("vertices count " + vertices.size());
	
			// Find shortest (minimizes sum of path weights) path to each vertex.
			Collection<GraphNode> foundPaths = shortestPaths
					.findPathVertices(vertices);
			
			if( log.isDebugEnabled() ) log.debug("found Paths " + foundPaths.size());
			
			// Remove duplicate edges
			Set<AroEdge<T>> minEdges = new HashSet<>();
			for (GraphNode v : vertices) {
	
				List<GraphNode> path = Graphs.getPathVertexList(shortestPaths
						.getGraphPath(v));
				
				if( log.isTraceEnabled() ) log.trace("path Length for v " + path.size());
				
				Collections.reverse(path) ;
				
				Iterator<GraphNode> itr = path.iterator() ;
			
				GraphNode previous = itr.next();
				while(itr.hasNext() ) {
					GraphNode next = itr.next() ;
					AroEdge<T> edge = graph.getEdge(previous, next) ;
					markedEdges.remove(edge) ;
					if( !minEdges.contains(edge) ) {
						log.debug("add edge " + previous + "->" + next);
						minEdges.add(edge) ;
						addEdge(previous, next, edge);
					}
					previous = next ;
				}
			}
			
			writeLeafEdges(shortestPaths, markedEdges);
			
			if( log.isDebugEnabled() ) log.debug("minEdges " + minEdges.size());
		}
		dagBuilder.setRoot(src);
		return dagBuilder.buildDAG();

	}

	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<T>> getClosestFirstSurfaceBuilder() {
		return closestFirstSurfaceBuilder;
	}

	private void writeLeafEdges(AllShortestPaths<GraphNode, AroEdge<T>> sp, Set<AroEdge<T>>  remainingEdges) {
		for (AroEdge<T> e : remainingEdges) {
			
			GraphNode src = graphModel.getGraph().getEdgeSource(e) ;
			GraphNode target =  graphModel.getGraph().getEdgeTarget(e) ;
			
			
			double srcWeight = sp.getWeight(src) ;
			double targetWeight = sp.getWeight(target) ;
			
			log.debug("leaf src weight " +  srcWeight) ;
			log.debug("leaf target weight " +  targetWeight) ;
			
			if( targetWeight > srcWeight ) {
				log.debug("add flipped leaf edge " + target + "->" + src);
				addEdge(target, src, e);
				
			} else {
				log.debug("add leaf edge " + src + "->" + target);
				addEdge(src, target, e);
			}
		}
	}


	@Override
	public boolean onPathFound(DAGPath<GraphNode, AroEdge<T>> path) {
		path.getPathEdges().forEach(e -> {

			AroEdge<T> edge = e.getEdge();

			if (!foundEdges.contains(edge)) {
				foundEdges.add(edge);
				markedEdges.remove(edge);
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
