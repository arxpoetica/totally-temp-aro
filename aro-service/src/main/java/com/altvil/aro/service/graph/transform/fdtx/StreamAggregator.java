package com.altvil.aro.service.graph.transform.fdtx;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.jgrapht.DirectedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.FDHNode;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.transform.FDHAssignments;


public class StreamAggregator {


	private static final Logger log = LoggerFactory
			.getLogger(StreamAggregator.class.getName());

	
	//private GraphTransformerFactory graphFactory;
	
	private DirectedGraph<GraphNode, AroEdge<Long>> graph;
	private Map<AroEdge<Long>, LocationsStream> assemblerMap;

	private int maxlocationPerFDT;
	private int maxLocationPerFDH;

	private GraphNodeFactory nodeFactory ;
	
	private List<LocationGroup> groups = new ArrayList<>();
	private int currentLocationCount = 0;

	private List<FDHAssignments> fdhAssigments = new ArrayList<>();
	
	
	//private GraphModelBuilder<LocationsStream> graphBuilder ;
	//private List<GraphNode> visitedVertices ;
	//private Map<AroEdge<Long>, LocationsStream> visitedStreams ;
	

	public StreamAggregator(GraphNodeFactory nodeFactory, DirectedGraph<GraphNode, AroEdge<Long>> graph,
			Map<AroEdge<Long>, LocationsStream> assemblerMap, int maxlocationPerFDT,
			int maxLocationPerFDH) {
		super();
		this.nodeFactory = nodeFactory ;
		this.graph = graph;
		this.assemblerMap = assemblerMap;
		this.maxlocationPerFDT = maxlocationPerFDT;
		this.maxLocationPerFDH = maxLocationPerFDH;
	}

	public Collection<FDHAssignments> getAssignments() {
		return fdhAssigments;
	}

	public void flush(GraphNode node) {
		flushGroup(node);
	}

	
	
	public void aggregate1(GraphNode node) {
		
		
	}
	
	@SuppressWarnings("unused")
	private class FDHGroup {
		
		private GraphModelBuilder<LocationsStream> graphBuilder ;
		private int streamCount ;
		private List<LocationsStream> childStreams = new ArrayList<LocationsStream>() ;
		
		private boolean satisfiesConstraint(int delta) {
			
			return true ;
		}
		
		private void flush(VertexAnalyzer analyzer) {
			streamCount+= analyzer.getStreamCount() ;
			childStreams.addAll(analyzer.getChildStreams()) ;
		}
		
		public boolean collect(VertexAnalyzer analyzer) {
			
			if( satisfiesConstraint(analyzer.getStreamCount()) ) {
				flush(analyzer) ;
			} 
			else {
				
			}
			
			return false ;
		}
		
		
	}
	
	private class VertexAnalyzer {
		private int streamCount ;
		private Map<AroEdge<Long>, LocationsStream> streams = new HashMap<AroEdge<Long>, LocationsStream>() ;
		
		@SuppressWarnings("unused")
		public void aggregate(GraphNode node) {
			Collection<AroEdge<Long>> incomingEdges = graph.incomingEdgesOf(node) ;
			incomingEdges.stream().forEach(e -> {
				LocationsStream childStream = assemblerMap.remove(e);
				if( childStream == null ) {
					if (log.isErrorEnabled())
						log.error("Stream Error " + node + " edge = " + e);
				} else  {
					childStream.link(e);
					streams.put(e, childStream) ;
					streamCount += childStream.getLocationCount() ;
				}
			});
		}
		
		public Collection<LocationsStream> getChildStreams() {
			return streams.values() ;
		}
		
		public int getStreamCount() {
			return streamCount ;
		}
		
		
	}
	
	
	public void aggregate(GraphNode node) {
		graph.incomingEdgesOf(node).forEach(e -> {
			LocationsStream childStream = assemblerMap.remove(e);
			if (childStream == null) {
				if (log.isErrorEnabled())
					log.error("Stream Error " + node + " edge = " + e);
			} else {
				childStream.link(e);
				
				
				LocationGroup group = group(childStream);
				
				if (group.getLocationCount() + currentLocationCount > maxLocationPerFDH) {
					flushGroup(e.getTargetNode());
				}
				
				groups.add(group);
				currentLocationCount += group.getLocationCount();
			}
		});
		
	}

	private void flushGroup(GraphNode node) {

		if (groups.size() > 0) {

			write(node, groups);

			groups.clear();
			currentLocationCount = 0;
		}
	}

	private Collection<FDTNode> toFDTNodes(
			Collection<LocationAggregate> aggregates) {

		return aggregates.stream().map(a -> a.toFDTNode())
				.collect(Collectors.toList());

	}

	private void write(GraphNode node, Collection<LocationGroup> groups) {
		groups.forEach(g -> {

			Collection<FDTNode> fdts = toFDTNodes(g.aggregates());

			FDHNode fdh = nodeFactory.createFDHNode(null, node.getPoint());
			fdhAssigments.add(new FDHAssignments(node, fdts, fdh));

		});
	}

	private LocationGroup group(LocationsStream stream) {
		
		LocationGroup group = new LocationGroup(stream);
		LocationAggregate la = new LocationAggregate(nodeFactory, maxlocationPerFDT);

		for (LocationIntersection li : stream.getLocations()) {
			if (!la.add(li)) {
				group.add(la);
				la = new LocationAggregate(nodeFactory, maxlocationPerFDT);
			}
		}

		if (!la.isEmpty()) {
			group.add(la);
		}

		return group;
	}

}