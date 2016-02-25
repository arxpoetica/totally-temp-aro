package com.altvil.aro.service.network.impl;

import java.util.Collection;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;

@Service
public class NetworkServiceImpl implements NetworkService {

	@Override
	public NetworkData getNetworkData(int planId) {
		
		NetworkData networkData = new NetworkData() ;
		
		NetworkRequest networkRequest = createRequest(planId) ;
		networkData.setFiberSources(getFiberSources(networkRequest));
		networkData.setRoadLocations(getLocations(networkRequest));
		networkData.setRoadEdges(getRoadEdges(networkRequest)) ;
		
		return networkData;
	}
	
	
	private NetworkRequest createRequest(int jobId) {
		return null ;
	}
	
	
	private Collection<RoadLocation> getLocations(NetworkRequest networkRequest) {
		return null ;
	}
	
	private Collection<NetworkAssignment> getFiberSources(NetworkRequest networkRequest) {
		return null ;
	}
	
	private Collection<RoadEdge> getRoadEdges(NetworkRequest networkRequest) {
		return null ;
	}
	
	
	private static class NetworkRequest {
		
		
	}
	
	
}
