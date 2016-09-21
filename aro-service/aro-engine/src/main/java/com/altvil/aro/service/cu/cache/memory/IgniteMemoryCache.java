package com.altvil.aro.service.cu.cache.memory;

import java.io.Serializable;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.apache.ignite.cache.eviction.lru.LruEvictionPolicy;
import org.apache.ignite.configuration.CacheConfiguration;

import com.altvil.aro.service.cu.cache.CacheHandle;
import com.altvil.aro.service.cu.cache.CacheType;
import com.altvil.aro.service.cu.cache.SimpleCache;
import com.altvil.aro.service.cu.cache.impl.AbstractCacheHandle;
import com.altvil.aro.service.cu.cache.query.CacheKey;
import com.altvil.aro.service.cu.resource.ResourceVersion;

public class IgniteMemoryCache implements SimpleCache {

	@SuppressWarnings("unused")
	private Ignite ignite;

	private IgniteCache<CacheKey, MemoryVersionedObject> igniteCache;

	public IgniteMemoryCache(String name, CacheMode cacheMode, Ignite ignite,
			int maxSize) {
		this.ignite = ignite;
		igniteCache = createCache(name, cacheMode, ignite, maxSize);
	}

	@Override
	public CacheType getCacheType() {
		return CacheType.MEMORY;
	}

	private IgniteCache<CacheKey, MemoryVersionedObject> createCache(
			String name, CacheMode cacheMode, Ignite ignite, int maxSize) {
		CacheConfiguration<CacheKey, MemoryVersionedObject> cacheCfg = new CacheConfiguration<>();
		cacheCfg.setName(name);
		cacheCfg.setAtomicityMode(CacheAtomicityMode.ATOMIC);
		cacheCfg.setCacheMode(cacheMode);
		cacheCfg.setEvictionPolicy(new LruEvictionPolicy<>(maxSize));
		return ignite.getOrCreateCache(cacheCfg);

	}

	@Override
	public CacheHandle createCacheHandle(CacheKey key,
			ResourceVersion resourceVersion) {
		return new CacheHandleImpl(key, resourceVersion);
	}

	public static class MemoryVersionedObject implements Serializable {

		/**
		 *
		 */
		private static final long serialVersionUID = 1L;
		private ResourceVersion resourceVersion;
		private Serializable value;

		public MemoryVersionedObject(ResourceVersion resourceVersion,
				Serializable value) {
			super();
			this.resourceVersion = resourceVersion;
			this.value = value;
		}

		public ResourceVersion getResourceVersion() {
			return resourceVersion;
		}

		public Serializable getValue() {
			return value;
		}

	}

	private class CacheHandleImpl extends AbstractCacheHandle implements
			CacheHandle {

		private final ResourceVersion resourceVersion;

		public CacheHandleImpl(CacheKey key, ResourceVersion resourceVersion) {
			super(key);
			this.resourceVersion = resourceVersion;
		}

		private void updateIgniteCache(MemoryVersionedObject vo) {
			igniteCache.put(getCacheKey(), vo);
		}

		@Override
		public <T> T tryRead(Class<T> clz) {
			MemoryVersionedObject vo = igniteCache.get(getCacheKey());
			if (vo != null) {
				ResourceVersion rv = vo.getResourceVersion();
				// Cache Hit
				if (rv.equals(resourceVersion)) {
					return clz.cast(vo.getValue());
				}
			}

			return null;
		}

		@Override
		public <T> void write(T value) {
			MemoryVersionedObject vo = new MemoryVersionedObject(
					resourceVersion, (Serializable) value);
			updateIgniteCache(vo);
		}

	}

}
