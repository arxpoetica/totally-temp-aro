package com.altvil.netop.optimize;

import java.util.Collections;
import java.util.Map;

import com.altvil.aro.service.optimization.CustomOptimization;

@SuppressWarnings("serial")
public class AroCustomOptimization implements CustomOptimization {


	private String name;
	private Map<String, String> map = Collections.emptyMap();

	@Override
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@Override
	public Map<String, String> getMap() {
		return map;
	}

	public void setMap(Map<String, String> map) {
		this.map = map;
	}

}
