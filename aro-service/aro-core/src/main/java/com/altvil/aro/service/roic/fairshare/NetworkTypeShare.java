package com.altvil.aro.service.roic.fairshare;

import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkType;

public class NetworkTypeShare {

	public static class Builder {

		private Map<NetworkType, Double> assignments;
		// private double total = 0;

		public Builder add(NetworkType type, double percent) {
			assignments.put(type, percent);
			// total += percent;
			return this;
		}

		public NetworkTypeShare build() {

			return new NetworkTypeShare(assignments);
		}
	}

	private final Map<NetworkType, Double> assignments;
	private final Set<NetworkType> networkTypes;

	private NetworkTypeShare(Map<NetworkType, Double> assignments) {
		super();

		this.assignments = assignments;
		this.networkTypes = assignments.keySet();
	}

	public Set<NetworkType> getNetworkTypes() {
		return networkTypes;
	}

	public double getValue(NetworkType type) {
		Double v = assignments.get(type);
		return v == null ? 0 : v;
	}

}
