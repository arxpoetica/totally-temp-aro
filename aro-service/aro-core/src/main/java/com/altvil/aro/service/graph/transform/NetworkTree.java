package com.altvil.aro.service.graph.transform;

import java.util.Collection;

import com.altvil.aro.service.graph.segment.PinnedLocation;

public interface NetworkTree {
	
	public PinnedLocation getParentNode() ;
	public Collection<NetworkTree> getChildrenNodes() ;

}
