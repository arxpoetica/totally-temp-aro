package com.altvil.aro.service.cu.cache.impl;

import com.altvil.aro.service.cu.cache.query.CacheKey;
import com.altvil.aro.service.cu.key.AroKey;

@SuppressWarnings("serial")
public class DefaultCacheKey  implements CacheKey {

	private AroKey bsaKey;
	private String cacheType;
	private String extentionKey;

	private int hash = 0;

	public DefaultCacheKey(String cacheType, AroKey bsaKey, String extentionKey) {
		super();
		this.cacheType = cacheType;
		this.bsaKey = bsaKey;
		this.extentionKey = extentionKey;
	}

	private int calcHash() {
		int result = getBsaKey().hashCode();
		result = 31 * result + getCacheType().hashCode();
		result = 31 * result + getExtendedCacheKey().hashCode();
		return result;

	}

	@Override
	public Integer getServiceAreaId() {
		return bsaKey.getServiceAreaId();
	}

	@Override
	public String getCacheType() {
		return cacheType;
	}

	@Override
	public String getExtendedCacheKey() {
		return extentionKey;
	}

	public AroKey getBsaKey() {
		return bsaKey;
	}

	public String getKey() {
		return extentionKey;
	}

	@Override
	public int hashCode() {
		if (hash == 0) {
			hash = calcHash();
		}
		return hash;
	}

	@Override
	public String getCacheTypeExtendedKey() {
		return (extentionKey.length() == 0) ? getCacheType() : getCacheType()
				+ "/" + getExtendedCacheKey();
	}

	@Override
	public String getScopedKey() {
		return (extentionKey.length() == 0) ? cacheType + "/"
				+ bsaKey.toString() : cacheType + "/" + bsaKey.toString() + "/"
				+ extentionKey;
	}

	@Override
	public boolean equals(Object obj) {
		if (obj instanceof CacheKey) {
			CacheKey other = (CacheKey) obj;
			return this.getBsaKey().equals(other.getBsaKey())
					&& this.getCacheType().equals(other.getCacheType())
					&& this.getExtendedCacheKey().equals(
							other.getExtendedCacheKey());

		}

		return false;
	}

}
