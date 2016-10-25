package com.altvil.aro.service.optimization;

import java.util.Map;

public class CustomOptimization {
	
	private String  name ;
	private Map<String, String> extendedAttributes ;
	
	public CustomOptimization(String name,
			Map<String, String> extendedAttributes) {
		super();
		this.name = name;
		this.extendedAttributes = extendedAttributes;
	}
	
	public String getName() {
		return name;
	}
	
	public Map<String, String> getExtendedAttributes() {
		return extendedAttributes;
	}
	
	
	

}
