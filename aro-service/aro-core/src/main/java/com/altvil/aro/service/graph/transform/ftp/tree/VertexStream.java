package com.altvil.aro.service.graph.transform.ftp.tree;

import java.util.List;

import com.altvil.aro.service.graph.node.GraphNode;

public interface VertexStream extends LocationStream  {

	public boolean isEmpty() ;
	
	public GraphNode getVertex();

	public List<EdgeStream> getIncommingStreams();

	
}
