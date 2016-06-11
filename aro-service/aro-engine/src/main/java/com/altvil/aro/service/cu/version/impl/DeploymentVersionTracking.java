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

import com.altvil.aro.model.DeploymentPlanVersionEntity;
import com.altvil.aro.model.DeploymentPlanVersionKey;
import com.altvil.aro.persistence.DeploymentPlanVersionRepository;
import com.altvil.aro.service.cu.cache.impl.BSACacheKey;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.key.AroKeyService;
import com.altvil.aro.service.cu.version.spi.VersionTrackingPersistence;
import com.altvil.aro.service.cu.version.spi.VersionUpdates;


public class DeploymentVersionTracking implements VersionTrackingPersistence {

	private static final Logger log = LoggerFactory
			.getLogger(DeploymentVersionTracking.class.getName());
	private DeploymentPlanVersionRepository versionRepository;
	private AroKeyService keyService;

	public DeploymentVersionTracking(
			DeploymentPlanVersionRepository versionRepository, AroKeyService keyService) {
		super();
		this.versionRepository = versionRepository;
		this.keyService = keyService;
	}

	public static VersionTrackingPersistence create(ApplicationContext ctx) {
		return new DeploymentVersionTracking(
				ctx.getBean(DeploymentPlanVersionRepository.class), ctx.getBean(AroKeyService.class));

	}

	@Override
	public Collection<AroKey> getPlanKeys(AroKey key) {
		return new ArrayList<>();
	}

	@Override
	public Collection<AroKey> getAffectedKeys(AroKey bsaKey) {
//		List<BsaKey> list = versionRepository.getChildPlans(bsaKey.getDeploymentPlanId()).stream()
//				.map(childPlanId -> keyService.createDeploymentKey(bsaKey.getServiceAreaId(), childPlanId))
//				.collect(Collectors.toList());
		return Collections.singleton(bsaKey) ;
	}

	protected DeploymentPlanVersionEntity save(
			DeploymentPlanVersionEntity version) {

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
		DeploymentPlanVersionKey key = toKey(bsaKey);
		DeploymentPlanVersionEntity entity = versionRepository.findOne(key);
		if (entity != null) {
			long version = entity.getDeploymentVersion() + 1;

			do {
				entity.setDeploymentVersion(version);
				entity = save(entity);
			} while (entity.getDeploymentVersion() < version);

			return entity.getDeploymentVersion();
		} else {
			return null;
		}
	}

	public Long startVersionTracking(AroKey bsaKey) {
		DeploymentPlanVersionEntity entity = new DeploymentPlanVersionEntity();
		entity.setKey(toKey(bsaKey));
		return save(entity).getDeploymentVersion();
	}

	private DeploymentPlanVersionKey toKey(AroKey bsaKey) {
		DeploymentPlanVersionKey key = new DeploymentPlanVersionKey();
		key.setDeploymentPlanId(bsaKey.getDeploymentPlanId());
		key.setServiceAreaId(bsaKey.getServiceAreaId());
		return key;
	}

	private BSACacheKey toBsaKey(DeploymentPlanVersionKey key) {
		return new BSACacheKey(key.getServiceAreaId(),
				key.getDeploymentPlanId());
	}

	@Override
	public Long loadVersion(AroKey bsaKey) {
		DeploymentPlanVersionKey key = toKey(bsaKey);
		DeploymentPlanVersionEntity version = versionRepository.findOne(key);
		return version == null ? null : version.getDeploymentVersion();
	}

	@Override
	public VersionUpdates checkDbForVersionChanges(Date lastDate) {

		Date prviousDate = lastDate;
		Set<DeploymentPlanVersionEntity> versions = versionRepository
				.findByLastUpdatedAfter(lastDate);
		Map<AroKey, Long> result = new HashMap<>();
		for (DeploymentPlanVersionEntity v : versions) {
			if (v.getLastUpdated().after(prviousDate)) {
				prviousDate = v.getLastUpdated();
			}
			result.put(toBsaKey(v.getKey()), v.getDeploymentVersion());
		}

		return new VersionUpdates(result, prviousDate);
	}

}

