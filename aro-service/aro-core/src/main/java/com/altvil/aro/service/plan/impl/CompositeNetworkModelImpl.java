package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.Map;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;

public class CompositeNetworkModelImpl implements CompositeNetworkModel {

	private Map<NetworkAssignment, NetworkModel> map;
	
	public CompositeNetworkModelImpl(Collection<NetworkModel> networkModels) {
		super();
		this.map = StreamUtil.hash(networkModels, NetworkModel::getFiberSourceAssignment);
	}

	@Override
	public NetworkModel getNetworkModel(NetworkAssignment networkAssignment) {
		return map.get(networkAssignment);
	}

	@Override
	public Collection<NetworkModel> getNetworkModels() {
		return map.values();
	}

	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}
}
