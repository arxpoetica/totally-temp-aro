package com.altvil.aro.service.cu.cache.impl;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

import com.altvil.aro.service.cu.cache.CacheHandle;
import com.altvil.aro.service.cu.cache.CacheType;
import com.altvil.aro.service.cu.cache.SimpleCache;
import com.altvil.aro.service.cu.cache.query.CacheKey;
import com.altvil.aro.service.cu.resource.ResourceVersion;

public class BinaryCacheAdaptor implements SimpleCache {

	private SimpleCache cache;
	
	public BinaryCacheAdaptor(SimpleCache cache) {
		super();
		this.cache = cache;
	}
	
	@Override
	public CacheType getCacheType() {
		return cache.getCacheType() ;
	}

	@Override
	public CacheHandle createCacheHandle(CacheKey key,
			ResourceVersion resourceVersion) {
		return new BinaryCacheHandle(cache.createCacheHandle(key, resourceVersion)) ;
	}

	private class BinaryCacheHandle implements CacheHandle {

		private CacheHandle cacheHandle;
		
		public BinaryCacheHandle(CacheHandle cacheHandle) {
			super();
			this.cacheHandle = cacheHandle;
		}

		@Override
		public CacheKey getCacheKey() {
			return cacheHandle.getCacheKey();
		}

		private <T> byte[] serialize(T value) {
			ByteArrayOutputStream os = new ByteArrayOutputStream();

			try (ObjectOutputStream out = new ObjectOutputStream(
					os)) {
				out.writeObject(value);
			} catch (IOException e) {
				throw new RuntimeException(e.getMessage(), e);
			}

			return os.toByteArray();

		}

		private <T> T deserialize(byte[] data, Class<T> clz) {
			if (data == null) {
				return null;
			}

			try (ObjectInputStream in = new ObjectInputStream(
					new ByteArrayInputStream(data))) {

				return clz.cast(in.readObject());
			} catch (Throwable e) {
				throw new RuntimeException(e.getMessage(), e);
			}
		}

		@Override
		public <T> T tryRead(Class<T> clz) {
			return deserialize(cacheHandle.tryRead(byte[].class), clz);
		}

		@Override
		public <T> void write(T value) {
			cacheHandle.write(serialize(value));

		}

	}

}
