package com.altvil.aro.service.conversion.impl;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.conversion.EquipmentLocationMapping;
import com.altvil.aro.service.demand.impl.DefaultDemandStatistic;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.utils.func.Aggregator;

public class NetworkNodeAssembler {

	private Aggregator<DemandStatistic> aggregator = DefaultDemandStatistic
			.aggregate();

	public interface EquipmentResolver {
		NetworkNode getCentralOffice(long planId);
	}

	private NetworkNode networkNode;
	// private NetworkNode parentNode ;

	private EquipmentLocationMapping mappedLocations;

	public NetworkNodeAssembler(NetworkNode networkNode) {
		this.networkNode = networkNode;
	}

	public NetworkNode assemble(long planId, EquipmentResolver resolver) {
		if (networkNode == null) {
			networkNode = resolver.getCentralOffice(planId);
		}

		DemandStatistic ld = aggregator.apply();
		networkNode.setAtomicUnit(ld.getAtomicUnits());
		return networkNode;

	}

	public NetworkNode getNetworkNode() {
		return networkNode;
	}

	public NetworkNodeAssembler setParent(NetworkNodeAssembler parent,
			EquipmentLocationMapping mappedLocations) {
		this.mappedLocations = mappedLocations;
		return setParent(parent);
	}

	public NetworkNodeAssembler setParent(NetworkNodeAssembler parent) {
		// TODO When Generalized track parent relationship ;
		parent.addChildDemand(this.mappedLocations.getDemandStatistic());
		return this;
	}

	private void addChildDemand(DemandStatistic demand) {
		aggregator.add(demand);
	}

	public EquipmentLocationMapping getEquipmentLocationMapping() {
		return mappedLocations;
	}

	public DemandStatistic getLocationDemand() {
		return aggregator.apply();
	}

}
