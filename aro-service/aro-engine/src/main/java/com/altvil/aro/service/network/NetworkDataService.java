package com.altvil.aro.service.network;

import com.altvil.aro.service.graph.model.NetworkData;

public interface NetworkDataService {
	
	//Collection<NetworkAssignment> getFiberSources(NetworkDataRequest request) ;
	//Collection<NetworkAssignment> getNetworkLocations(NetworkDataRequest request) ;
	
	NetworkData getNetworkData(NetworkDataRequest request) ;
	

}
