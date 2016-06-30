package com.altvil.aro.service.network;

import java.util.Collection;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.interfaces.NetworkAssignment;

public interface NetworkDataService {
	
	Collection<NetworkAssignment> getFiberSources(NetworkDataRequest request) ;
	Collection<NetworkAssignment> getNetworkLocations(NetworkDataRequest request) ;
	
	NetworkData getNetworkData(NetworkDataRequest request) ;
	

}
