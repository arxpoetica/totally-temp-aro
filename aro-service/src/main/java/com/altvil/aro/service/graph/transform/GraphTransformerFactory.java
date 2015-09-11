package com.altvil.aro.service.graph.transform;

import java.util.Collection;

import org.jgrapht.EdgeFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNode;

public interface GraphTransformerFactory {
	
	public  GraphTransformer<AroEdge, Collection<FDTNode>> createBasicFDTTransformer(GraphModel<AroEdge> gm, int maxCount) ;
	
	
	public GraphTransformer<AroEdge, Collection<FDHAssignments>> createFTTXTransformer(GraphModel<AroEdge> gm, int maxFDTCount, int maxFDHCount) ;
	
	/**
	 * 
	 * @param edgeFactory
	 * @return
	 */
	public <E extends AroEdge> GraphModelBuilder<E> createBuilder(EdgeFactory<GraphNode, E> edgeFactory) ;

}
