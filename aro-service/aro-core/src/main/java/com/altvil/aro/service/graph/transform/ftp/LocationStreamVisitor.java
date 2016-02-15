package com.altvil.aro.service.graph.transform.ftp;

import com.altvil.aro.service.graph.transform.ftp.tree.EdgeStream;
import com.altvil.aro.service.graph.transform.ftp.tree.VertexStream;

public interface LocationStreamVisitor {
	
	public void visit(EdgeStream edgeStream) ;
	public void visit(VertexStream vertexStream) ;

}
