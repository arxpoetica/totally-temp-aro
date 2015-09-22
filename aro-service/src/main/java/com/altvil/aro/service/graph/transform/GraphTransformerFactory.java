package com.altvil.aro.service.graph.transform;

import java.util.Collection;

import org.jgrapht.EdgeFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;

public interface GraphTransformerFactory {
	
	public  GraphTransformer<Long, Collection<FDTNode>> createBasicFDTTransformer(GraphModel<Long> gm, int maxCount) ;
	
	
	public GraphTransformer<Long, Collection<FDHAssignments>> createFTTXTransformer(GraphModel<Long> gm, int maxFDTCount, int maxFDHCount) ;
	
	/**
	 * 
	 * @param edgeFactory
	 * @return
	 */
	public <T> GraphModelBuilder<T> createBuilder(EdgeFactory<GraphNode, AroEdge<T>> edgeFactory) ;

}
