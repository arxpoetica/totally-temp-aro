package com.altvil.netop.network.algorithms;

import java.util.Collections;
import java.util.Map;

import com.altvil.netop.network.AbstractNetworkStrategyRequest;

@Deprecated
public class ScalarSetupRequest extends AbstractNetworkStrategyRequest {
	@Override
	public String getAlgorithm() {
		return "SCALAR";
	}

	@Override
	public Map<String, Object> getProperties() {
		return Collections.emptyMap();
	}
}
