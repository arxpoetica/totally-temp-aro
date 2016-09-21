package com.altvil.aro.service.network;

import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.graph.model.NetworkData;

public interface NetworkDataService extends ComputeServiceApi {
	
	NetworkData getNetworkData(NetworkDataRequest request) ;
	

}
