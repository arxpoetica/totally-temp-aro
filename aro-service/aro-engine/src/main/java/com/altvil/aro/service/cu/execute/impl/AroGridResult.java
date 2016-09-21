package com.altvil.aro.service.cu.execute.impl;

import java.io.Serializable;

import com.altvil.aro.service.cu.cache.query.CacheQuery;

@SuppressWarnings("serial")
public class AroGridResult<T extends Serializable> implements Serializable {

	private CacheQuery cacheQuery;
	private String cacheName;
	private T result;

	private String exceptionMessage;

	public AroGridResult(CacheQuery cacheQuery, String cacheName, T result) {
		super();
		this.cacheQuery = cacheQuery;
		this.cacheName = cacheName;
		this.result = result;
	}

	public AroGridResult(CacheQuery cacheQuery, String cacheName, Throwable err) {
		super();
		this.cacheQuery = cacheQuery;
		this.cacheName = cacheName;
		this.exceptionMessage = err.getMessage();
	}

	public boolean isValid() {
		return exceptionMessage == null;
	}

	public T getValue() {
		return result;
	}

	public CacheQuery getCacheQuery() {
		return cacheQuery;
	}

	public String getCacheName() {
		return cacheName;
	}

	public String getExceptionMessage() {
		return exceptionMessage;
	}

}