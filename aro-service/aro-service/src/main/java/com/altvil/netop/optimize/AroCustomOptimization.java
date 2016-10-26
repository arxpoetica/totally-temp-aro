package com.altvil.netop.optimize;

import java.util.Map;

import com.altvil.aro.service.optimization.CustomOptimization;

@SuppressWarnings("serial")
public class AroCustomOptimization implements CustomOptimization {


	private String name;
	private Map<String, String> map;

	/* (non-Javadoc)
	 * @see com.altvil.netop.optimize.CustomOptimization#getName()
	 */
	@Override
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	/* (non-Javadoc)
	 * @see com.altvil.netop.optimize.CustomOptimization#getMap()
	 */
	@Override
	public Map<String, String> getMap() {
		return map;
	}

	public void setMap(Map<String, String> map) {
		this.map = map;
	}

}
