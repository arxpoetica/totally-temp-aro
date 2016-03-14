package com.altvil.aro.service.graph.transform.ftp.cluster;

import java.util.Collection;

public interface LocationClusterGroup {

	
	public Collection<LocationCluster> getAggregates();

	public void addIncommingCluster(LocationCluster cluster);

	public boolean supportsIncommingCluster() ;
	
	public LocationCluster getLastCluster();
	
	public LocationCluster removePartialCluster();
	

}