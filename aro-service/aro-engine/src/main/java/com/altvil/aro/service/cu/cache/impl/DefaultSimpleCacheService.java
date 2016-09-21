package com.altvil.aro.service.cu.cache.impl;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.apache.ignite.cache.CacheMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import com.altvil.aro.persistence.query.QueryExecutor;
import com.altvil.aro.persistence.repository.CacheEntityRepository;
import com.altvil.aro.service.cu.cache.SimpleCache;
import com.altvil.aro.service.cu.cache.SimpleCacheService;
import com.altvil.aro.service.cu.cache.db.DBCache;
import com.altvil.aro.service.cu.cache.memory.IgniteMemoryCache;
import org.springframework.stereotype.Service;

@Service
public class DefaultSimpleCacheService implements SimpleCacheService {

	private ApplicationContext applicationContext;

	private SimpleCache persistenceCache;

	@Autowired
	public DefaultSimpleCacheService(
			ApplicationContext applicationContext) {
		super();
		this.applicationContext = applicationContext;
	}

	@PostConstruct
	void init() {
		persistenceCache = createCache();
	}

	@Override
	public SimpleCache createPersistenceCache(String name) {
		return persistenceCache;
	}

	@Override
	public SimpleCache createMemoryCache(String name, int size,
			CacheMode cacheMode, boolean storeAsBinary) {
		SimpleCache cache = new IgniteMemoryCache(name, cacheMode,
				applicationContext.getBean(Ignite.class), size);
		return storeAsBinary ? new BinaryCacheAdaptor(cache) : cache;
	}

	private SimpleCache createCache() {
		return new DBCache(
				applicationContext.getBean(QueryExecutor.class),
				applicationContext
						.getBean(CacheEntityRepository.class));

	}

}
