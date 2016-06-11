package com.altvil.aro.service.conversion.impl;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.utils.func.Aggregator;

public class NetworkNodeAssembler {
	
	private NetworkNode networkNode ;
	private Aggregator<LocationDemand> aggregator = DefaultLocationDemand.demandAggregate() ;
	
	public NetworkNodeAssembler(NetworkNode networkNode) {
		this.networkNode = networkNode ;
	}
	
	public Aggregator<LocationDemand> getAggregator() {
		return aggregator ;
	}
	
	public NetworkNode getNetworkNode() {
		return networkNode ;
	}
	
	public void addChildDemand(LocationDemand demand) {
		 aggregator.add(demand) ;
	}
	
	public NetworkNodeAssembler setParent(NetworkNodeAssembler parent) {
		parent.addChildDemand(this.getLocationDemand()) ;
		return this ;
	}
	
	public LocationDemand getLocationDemand() {
		return aggregator.apply() ;
	}
	
}
