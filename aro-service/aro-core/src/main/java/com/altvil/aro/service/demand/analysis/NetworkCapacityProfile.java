package com.altvil.aro.service.demand.analysis;

import java.util.Collection;

public class NetworkCapacityProfile {

	private NetworkCapacity supplierCapacity;

	private Collection<EntityNetworkProfile> entityNetworkProfiles;

	public NetworkCapacity getSupplierCapacity() {
		return supplierCapacity;
	}

	public void setSupplierCapacity(NetworkCapacity supplierCapacity) {
		this.supplierCapacity = supplierCapacity;
	}

	public Collection<EntityNetworkProfile> getEntityNetworkProfiles() {
		return entityNetworkProfiles;
	}

	public void setEntityNetworkProfiles(
			Collection<EntityNetworkProfile> entityNetworkProfiles) {
		this.entityNetworkProfiles = entityNetworkProfiles;
	}
	
	

}
