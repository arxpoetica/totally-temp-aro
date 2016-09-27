package com.altvil.aro.service.cu.cache.db;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.CacheEntity;
import com.altvil.aro.model.PlanCacheKey;
import com.altvil.aro.persistence.query.QueryExecutor;
import com.altvil.aro.persistence.repository.CacheEntityRepository;
import com.altvil.aro.service.cu.cache.CacheHandle;
import com.altvil.aro.service.cu.cache.CacheType;
import com.altvil.aro.service.cu.cache.SimpleCache;
import com.altvil.aro.service.cu.cache.impl.AbstractCacheHandle;
import com.altvil.aro.service.cu.cache.query.CacheKey;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.resource.ResourceVersion;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;

public class DBCache implements SimpleCache {

	private static final Logger log = LoggerFactory
			.getLogger(PlanServiceImpl.class.getName());

	private CacheEntityRepository cacheEntityRepository;
	private QueryExecutor queryExecutor;

	public DBCache(QueryExecutor queryExecutor,
			CacheEntityRepository cacheEntityRepository) {
		this.queryExecutor = queryExecutor;
		this.cacheEntityRepository = cacheEntityRepository;
	}

	@Override
	public CacheType getCacheType() {
		return CacheType.PERISTSTENCE;
	}

	private PlanCacheKey createKey(CacheKey key) {
		return new PlanCacheKey(key.getServiceAreaId(), key
				.getBsaKey().getPlanId(),
				key.getCacheTypeExtendedKey());
	}

	private CacheEntity doSave(CacheEntity entity,
			int count) {
		try {
			entity = cacheEntityRepository.save(entity);
			return entity;
		} catch (DataIntegrityViolationException exception) {
			log.warn("Creational Optimistic Exception fetching data "
					+ exception.getMessage());
			try {
				Thread.sleep((long) (Math.random() * 2000));

				CacheEntity existingEntity = cacheEntityRepository
						.findOne(entity.getKey());

				if (existingEntity != null) {
					return existingEntity;
				}

				if (count >= 3) {
					throw new RuntimeException(
							"Failed to obtain optimistic Lock ");
				}
				return doSave(entity, count + 1);

			} catch (InterruptedException e) {
				throw new RuntimeException(e.getMessage(), e);
			}

		}
	}

	@Override
	public CacheHandle createCacheHandle(CacheKey key, ResourceVersion rv) {

		PlanCacheKey cacheKey = createKey(key);
		CacheEntity entity = cacheEntityRepository
				.findOne(cacheKey);
		if (entity == null) {
			entity = new CacheEntity();
			entity.setKey(cacheKey);
			entity = doSave(entity, 0);
		}
		return new CacheHandleImpl(key, entity, rv);
	}

	private class CacheHandleImpl extends AbstractCacheHandle implements
			CacheHandle {

		private CacheEntity deploymentCacheEntity;
		private ResourceVersion resourceVersion;

		public CacheHandleImpl(CacheKey cacheKey,
				CacheEntity deploymentCacheEntity,
				ResourceVersion resourceVersion) {
			super(cacheKey);
			this.deploymentCacheEntity = deploymentCacheEntity;
			this.resourceVersion = resourceVersion;
		}

		private <T> boolean equals(T a, T b) {
			if (a == null || b == null) {
				return a == b;
			}
			return a.equals(b);
		}

		private boolean matchResourceVersion() {
			return
					equals(resourceVersion.getVersion(VersionType.SERVICE),
							deploymentCacheEntity.getServiceAreaVersion())
			&& equals(resourceVersion.getVersion(VersionType.LOCATION),
					deploymentCacheEntity.getLocationVersion())
					&& equals(
							resourceVersion.getVersion(VersionType.NETWORK),
							deploymentCacheEntity.getVersion());

		}

		@Override
		public <T> T tryRead(Class<T> clz) {
			if (deploymentCacheEntity.getLength() == null
					|| deploymentCacheEntity.getLength() == 0
					|| !matchResourceVersion()) {
				return null;
			}

			try {
				return deserialize(clz);
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return null;
			}

		}

		@Transactional
		private <T> T deserialize(Class<T> clz) throws IOException,
				SQLException, ClassNotFoundException {

			CacheKey key = getCacheKey();
			AroKey bsaKey = key.getBsaKey();

			byte[] blob = cacheEntityRepository.queryBlobData(
					bsaKey.getServiceAreaId(), bsaKey.getPlanId(),
					key.getCacheTypeExtendedKey());
			try (ObjectInputStream in = new ObjectInputStream(
					new GZIPInputStream(new ByteArrayInputStream(blob)))) {
				return clz.cast(in.readObject());
			}
		}

		@Modifying
		@Transactional
		private <T> void save(CacheEntity deploymentCacheEntity,
				byte[] cacheData) {

			for (VersionType vt : resourceVersion.keys()) {
				switch (vt) {
				case LOCATION:
						deploymentCacheEntity.setLocationVersion(resourceVersion
								.getVersion(VersionType.LOCATION));
						break;
					case SERVICE:
						deploymentCacheEntity.setServiceAreaVersion(resourceVersion
								.getVersion(VersionType.SERVICE));
						break;
				case NETWORK:
					deploymentCacheEntity.setVersion(resourceVersion
							.getVersion(VersionType.NETWORK));
					break;
				}

			}

			//
			// deploymentPlanCacheRepository.updateDeploymentPlanCacheEntity(
			// bsaKey.getServiceAreaId(), bsaKey.getPlanId(),
			// key, deploymentCacheEntity.getOptiLock(),
			// deploymentCacheEntity.getVersion(),
			// deploymentCacheEntity.getLocationVersion(),
			// cacheData.length, cacheData);

			CacheKey key = getCacheKey();

			Map<String, Object> params = new HashMap<>();
			String query = "update cache.cache_entries set last_updated=now(),optlock=:optLock + 1, deployment_version=:deploymentVersion, location_version=:locationVersion, service_area_version=:serviceAreaVersion, cache_data = :blob, length = :length where service_area_id=:serviceAreaId and deployment_plan_id=:deploymentPlanId and cache_type=:key and optlock=:optLock";
			params.put("optLock", deploymentCacheEntity.getOptiLock());
			params.put("deploymentVersion", deploymentCacheEntity.getVersion());
			params.put("locationVersion",
					deploymentCacheEntity.getLocationVersion());
			params.put("blob", cacheData);
			params.put("serviceAreaId", key.getServiceAreaId());
			params.put("deploymentPlanId", key.getBsaKey()
					.getPlanId() == null ? -1 : key.getBsaKey()
					.getPlanId());

			params.put("serviceAreaVersion", deploymentCacheEntity.getServiceAreaVersion());


			params.put("key", key.getCacheTypeExtendedKey());
			params.put("length", (long) cacheData.length);

			queryExecutor.templateAction().execute(query, params, c -> {
				return c.executeUpdate();
			});

			deploymentCacheEntity.setOptiLock(deploymentCacheEntity
					.getOptiLock() + 1);

			// deploymentCacheEntity.setCacheData(cacheData);
			// deploymentPlanCacheRepository.save(deploymentCacheEntity);

		}

		@Override
		public <T> void write(T value) {

			ByteArrayOutputStream os = new ByteArrayOutputStream();
			try {
				try (ObjectOutputStream out = new ObjectOutputStream(
						new GZIPOutputStream(os))) {
					out.writeObject(value);
				}
				save(deploymentCacheEntity, os.toByteArray());
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				throw new RuntimeException(err.getMessage(), err);
			}

		}
	}

}
