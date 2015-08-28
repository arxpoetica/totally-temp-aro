package com.altvil.aro.service.graph.transform;

import java.util.Collection;

import com.altvil.aro.service.graph.node.FDTNode;

public interface GraphTransformerFactory {
	
	public GraphTransformer<Collection<FDTNode>> createBasicFDTTransformer(int maxCount) ;

}
