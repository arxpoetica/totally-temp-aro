package com.altvil.aro.service.cu.cache.query;

import java.io.Serializable;

import org.apache.ignite.cache.affinity.AffinityKeyMapped;

import com.altvil.aro.service.cu.key.AroKey;

public interface CacheKey extends Serializable {

	@AffinityKeyMapped
	Integer getServiceAreaId();

	String getCacheType();

	AroKey getBsaKey();

	String getExtendedCacheKey();

	String getCacheTypeExtendedKey();

	String getScopedKey();

}
