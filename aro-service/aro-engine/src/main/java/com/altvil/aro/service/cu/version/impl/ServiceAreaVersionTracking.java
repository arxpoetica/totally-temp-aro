package com.altvil.aro.service.cu.version.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import javax.persistence.OptimisticLockException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;

import com.altvil.aro.model.ServiceAreaAndPlanVersionKey;
import com.altvil.aro.model.ServiceAreaVersionEntity;
import com.altvil.aro.persistence.DeploymentPlanVersionRepository;
import com.altvil.aro.service.cu.cache.impl.AroCacheKey;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.key.AroKeyService;
import com.altvil.aro.service.cu.version.spi.VersionTrackingPersistence;
import com.altvil.aro.service.cu.version.spi.VersionUpdates;


public class ServiceAreaVersionTracking implements VersionTrackingPersistence {

	private static final Logger log = LoggerFactory
			.getLogger(ServiceAreaVersionTracking.class.getName());
	private DeploymentPlanVersionRepository versionRepository;
	//private AroKeyService keyService;

	public ServiceAreaVersionTracking(
			DeploymentPlanVersionRepository versionRepository, AroKeyService keyService) {
		super();
		this.versionRepository = versionRepository;
		//this.keyService = keyService;
	}

	public static VersionTrackingPersistence create(ApplicationContext ctx) {
		return new ServiceAreaVersionTracking(
				ctx.getBean(DeploymentPlanVersionRepository.class), ctx.getBean(AroKeyService.class));

	}

	@Override
	public Collection<AroKey> getPlanKeys(AroKey key) {
		return new ArrayList<>();
	}

	@Override
	public Collection<AroKey> getAffectedKeys(AroKey bsaKey) {
//		List<BsaKey> list = versionRepository.getChildPlans(bsaKey.getPlanId()).stream()
//				.map(childPlanId -> keyService.createDeploymentKey(bsaKey.getServiceAreaId(), childPlanId))
//				.collect(Collectors.toList());
		return Collections.singleton(bsaKey) ;
	}

	protected ServiceAreaVersionEntity save(
			ServiceAreaVersionEntity version) {

		try {
			return versionRepository.save(version);
		} catch (OptimisticLockException e) {
			log.info(
					"Optimistic lock while invalidating deployments version service area "
							+ version.getKey(), e);
			return versionRepository.findOne(version.getKey());
		}

	}

	@Override
	public Long incrementVersion(AroKey bsaKey) {
		ServiceAreaAndPlanVersionKey key = toKey(bsaKey);
		ServiceAreaVersionEntity entity = versionRepository.findOne(key);
		if (entity != null) {
			long version = entity.getServiceAreaVersion() + 1;

			do {
				entity.setServiceAreaVersion(version);
				entity = save(entity);
			} while (entity.getServiceAreaVersion() < version);

			return entity.getServiceAreaVersion();
		} else {
			return null;
		}
	}

	public Long startVersionTracking(AroKey bsaKey) {
		ServiceAreaVersionEntity entity = new ServiceAreaVersionEntity();
		entity.setKey(toKey(bsaKey));
		return save(entity).getServiceAreaVersion();
	}

	private ServiceAreaAndPlanVersionKey toKey(AroKey bsaKey) {
		ServiceAreaAndPlanVersionKey key = new ServiceAreaAndPlanVersionKey();
		key.setDeploymentPlanId(bsaKey.getPlanId());
		key.setServiceAreaId(bsaKey.getServiceAreaId());
		return key;
	}

	private AroCacheKey toBsaKey(ServiceAreaAndPlanVersionKey key) {
		return new AroCacheKey(key.getServiceAreaId(),
				key.getDeploymentPlanId());
	}

	@Override
	public Long loadVersion(AroKey bsaKey) {
		ServiceAreaAndPlanVersionKey key = toKey(bsaKey);
		ServiceAreaVersionEntity version = versionRepository.findOne(key);
		return version == null ? null : version.getServiceAreaVersion();
	}

	@Override
	public VersionUpdates checkDbForVersionChanges(Date lastDate) {

		Date prviousDate = lastDate;
		Set<ServiceAreaVersionEntity> versions = versionRepository
				.findByLastUpdatedAfter(lastDate);
		Map<AroKey, Long> result = new HashMap<>();
		for (ServiceAreaVersionEntity v : versions) {
			if (v.getLastUpdated().after(prviousDate)) {
				prviousDate = v.getLastUpdated();
			}
			result.put(toBsaKey(v.getKey()), v.getServiceAreaVersion());
		}

		return new VersionUpdates(result, prviousDate);
	}

}

