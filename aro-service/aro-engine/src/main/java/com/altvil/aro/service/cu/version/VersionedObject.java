package com.altvil.aro.service.cu.version;

import java.io.Serializable;

import com.altvil.aro.service.cu.resource.ResourceVersion;

public class VersionedObject<T> implements Serializable {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private ResourceVersion version ;
	private T value ;
	
	public VersionedObject(ResourceVersion version, T value) {
		super();
		this.version = version;
		this.value = value;
	}
	
	public VersionedObject() {
		super();
	}
	
	public ResourceVersion getVersion() {
		return version;
	}
	public void setVersion(ResourceVersion version) {
		this.version = version;
	}
	public T getValue() {
		return value;
	}
	public void setValue(T value) {
		this.value = value;
	}
	
	
	

}
