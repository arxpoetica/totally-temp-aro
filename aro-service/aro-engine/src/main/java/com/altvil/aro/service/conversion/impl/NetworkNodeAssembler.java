package com.altvil.aro.service.conversion.impl;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.utils.func.Aggregator;

public class NetworkNodeAssembler {
	
	
	public interface EquipmentResolver {
		NetworkNode getCentralOffice(long planId) ;
	}
	
	private NetworkNode networkNode ;
	
	private Aggregator<LocationDemand> aggregator = DefaultLocationDemand.demandAggregate() ;
	
	public NetworkNodeAssembler(NetworkNode networkNode) {
		this.networkNode = networkNode ;
	}
	
	public Aggregator<LocationDemand> getAggregator() {
		return aggregator ;
	}
	
	public NetworkNode assemble(long planId, EquipmentResolver resolver) {
		if( networkNode == null ) {
			networkNode = resolver.getCentralOffice(planId) ;
		}
		
//		LocationDemand ld = aggregator.apply() ;
		//TODO GIANT Develop Model for counting Premises by NetworkNode
//		networkNode.setHouseHoldCount(ld.getLocationDemand(LocationEntityType.Household).getDemand()) ;
//		networkNode.setBusinessCount(ld.getLocationDemand(LocationEntityType.LargeBusiness).getDemand()) ;
//		networkNode.setCellTowerCount(ld.getLocationDemand(LocationEntityType.CellTower).getDemand()) ;
//		networkNode.setAtomicUnit(ld.getDemand()) ;
		return networkNode ;
		
	}
	
	
	public NetworkNode getNetworkNode() {
		return networkNode ;
	}
	
	
	private void addChildDemand(LocationDemand demand) {
		 aggregator.add(demand) ;
	}
	
	public NetworkNodeAssembler setParent(NetworkNodeAssembler parent, LocationDemand ld) {
		addChildDemand(ld) ;
		return setParent(parent) ;
	}
	
	public NetworkNodeAssembler setParent(NetworkNodeAssembler parent) {
		parent.addChildDemand(this.getLocationDemand()) ;
		return this ;
	}
	
	public LocationDemand getLocationDemand() {
		return aggregator.apply() ;
	}
	
}
