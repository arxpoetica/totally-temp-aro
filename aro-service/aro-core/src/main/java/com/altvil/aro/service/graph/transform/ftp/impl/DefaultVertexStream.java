package com.altvil.aro.service.graph.transform.ftp.impl;

import java.util.Collections;
import java.util.List;

import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.transform.ftp.LocationStreamVisitor;
import com.altvil.aro.service.graph.transform.ftp.tree.AbstractLocationStream;
import com.altvil.aro.service.graph.transform.ftp.tree.EdgeStream;
import com.altvil.aro.service.graph.transform.ftp.tree.VertexStream;

public class DefaultVertexStream extends AbstractLocationStream implements
		VertexStream {

	private static final List<EdgeStream> EMPTY_LIST = Collections.emptyList() ;
	public static final VertexStream EMPTY_VERTEX= new DefaultVertexStream(null) ;
	
	private GraphNode graphNode;
	private List<EdgeStream> edgeStreams;

	public DefaultVertexStream(double maxDistanceToEnd, int count, double demand,
			GraphNode graphNode, List<EdgeStream> edgeStreams) {
		super(maxDistanceToEnd, count, demand);
		this.graphNode = graphNode;
		this.edgeStreams = edgeStreams;
	}
	
	public DefaultVertexStream(GraphNode graphNode) {
		this(0, 0, 0, graphNode, EMPTY_LIST) ;
	}

	@Override
	public GraphNode getVertex() {
		return graphNode;
	}
	
	

	@Override
	public void accept(LocationStreamVisitor visitor) {
		visitor.visit(this) ;
	}

	@Override
	public List<EdgeStream> getIncommingStreams() {
		return edgeStreams;
	}

	@Override
	public boolean isEmpty() {
		return graphNode == null || edgeStreams.size() == 0 ;
	}
	
	

}
