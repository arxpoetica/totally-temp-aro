package com.altvil.aro.service.plan;

import java.util.Collection;

import com.altvil.interfaces.NetworkAssignment;

public interface CompositeNetworkModel {
	
	public NetworkModel getNetworkModel(NetworkAssignment networkAssignment) ;
	public Collection<NetworkModel>  getNetworkModels() ;

}
