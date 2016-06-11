package com.altvil.aro.service.cu.cache;

public enum CacheType {
	
	MEMORY("M"), PERISTSTENCE("P");

	private String code;

	private CacheType(String code) {
		this.code = code;
	}

	public String getCode() {
		return code;
	}

}
