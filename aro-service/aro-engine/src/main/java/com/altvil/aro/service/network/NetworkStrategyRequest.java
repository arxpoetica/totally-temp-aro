package com.altvil.aro.service.network;

import java.util.Map;

public interface NetworkStrategyRequest {
	String getAlgorithm();
		Map<String, Object> getProperties();
}
