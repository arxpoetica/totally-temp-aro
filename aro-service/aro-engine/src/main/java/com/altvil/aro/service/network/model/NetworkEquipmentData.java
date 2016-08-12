package com.altvil.aro.service.network.model;

import java.io.Serializable;
import java.util.Collection;

import com.altvil.interfaces.NetworkAssignment;

@SuppressWarnings("serial")
public class NetworkEquipmentData implements Serializable {

	private Collection<NetworkAssignment> fiberSources;

	public NetworkEquipmentData(Collection<NetworkAssignment> fiberSources) {
		super();
		this.fiberSources = fiberSources;
	}

	public Collection<NetworkAssignment> getFiberSources() {
		return fiberSources;
	}

}
