package com.altvil.aro.service.optimization;

import java.io.Serializable;
import java.util.Map;

public interface CustomOptimization extends Serializable {

	public String getName();

	public Map<String, String> getMap();

}