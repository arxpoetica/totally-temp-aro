package com.altvil.aro.service.strategy;

public class NoSuchStrategy extends Exception {
	private static final long serialVersionUID = 1L;
	private final String typeName;
	private final String name;

	public NoSuchStrategy(Class<?> type, String name) {
		this.typeName = type.getName();
		this.name = name;
	}

	public String getTypeName() {
		return typeName;
	}

	public String getName() {
		return name;
	}

}
