package com.altvil.aro.service.graph.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.jgrapht.Graphs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.AllShortestPaths;
import com.altvil.aro.service.graph.alg.DAGPath;
import com.altvil.aro.service.graph.alg.GraphPathListener;
import com.altvil.aro.service.graph.alg.PathEdge;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.model.Reversable;
import com.altvil.aro.service.graph.node.GraphNode;

public class DagBuilder<T> implements GraphPathListener<GraphNode, AroEdge<T>> {

	private static final Logger log = LoggerFactory
			.getLogger(DagBuilder.class.getName());
	
	private GraphModelBuilder<T> dagBuilder;
	private GraphModel<T> graphModel;

	private Set<AroEdge<T>> foundEdges = new HashSet<>();
	private Set<AroEdge<T>> markedEdges;

	public DagBuilder(GraphModelBuilder<T> dagBuilder, GraphModel<T> graphModel) {
		super();
		this.dagBuilder = dagBuilder;
		this.graphModel = graphModel;
	}

	public DAGModel<T> createDAG(Predicate<AroEdge<T>> predicate, GraphNode src) {

		markedEdges = graphModel.getEdges().stream().filter(predicate)
				.collect(Collectors.toSet());
		
		if( log.isDebugEnabled() ) log.debug("marked edges " + markedEdges.size());
		
		dagBuilder.addVertex(src) ;
		
		if( markedEdges.size() > 0 ) {
			AllShortestPaths<GraphNode, AroEdge<T>> shortestPaths = new AllShortestPaths<GraphNode, AroEdge<T>>(
					graphModel.getGraph(), src);
			
			
			Set<GraphNode> vertices = toVertices(markedEdges) ;
			
			if( log.isDebugEnabled() ) log.debug("vertices count " + vertices.size());
	
	
			Collection<GraphNode> foundPaths = shortestPaths
					.findPathVertices(vertices);
	
			
			if( log.isDebugEnabled() ) log.debug("found Paths " + foundPaths.size());
	
			
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
					AroEdge<T> edge = graphModel.getGraph().getEdge(previous, next) ;
					markedEdges.remove(edge) ;
					if( !minEdges.contains(edge) ) {
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

	public Set<GraphNode> toVertices(Set<AroEdge<T>> nodes) {
		HashSet<GraphNode> result = new HashSet<GraphNode>();
		nodes.forEach(e -> {
			result.add(e.getSourceNode());
			result.add(e.getTargetNode());
		});

		return result;

	}

	private void writeLeafEdges(AllShortestPaths<GraphNode, AroEdge<T>> sp, Set<AroEdge<T>>  remainingEdges) {
		for (AroEdge<T> e : remainingEdges) {
			
			GraphNode src = e.getSourceNode() ;
			GraphNode target = e.getTargetNode() ;
			if( sp.getWeight(src) > sp.getWeight(target) ) {
				addEdge(target, src, e);
			} else {
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
