package com.altvil.aro.service.roic;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.model.NetworkType;

public class RoicNetworkInputs {

	
	public static class Builder {
		
		private RoicNetworkInputs inputs ;
		
		public Builder setCost(double networkCost) {
			inputs.networkCost = networkCost ;
			return this ;
		}
		
		public Builder add(NetworkState networkState) {
			inputs.map.put(networkState.getType(), networkState) ;
			return this ;
		}
		
		public RoicNetworkInputs build() {
			return inputs ;
		}
		
		
	}
	
	private Map<LocationEntityType, NetworkState> map = new EnumMap<>(
			LocationEntityType.class);
	private NetworkType networkType;
	private double networkCost;

	public NetworkState getNetWorkState(LocationEntityType type) {
		return null;
	}

	public NetworkType getNetworkType() {
		return networkType;
	}

	public void setNetworkType(NetworkType networkType) {
		this.networkType = networkType;
	}

	public double getNetworkCost() {
		return networkCost;
	}

	public void setNetworkCost(double networkCost) {
		this.networkCost = networkCost;
	}

}
