package com.altvil.aro.service.cu.version.impl;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.cu.execute.AroExecutorService;
import com.altvil.aro.service.cu.execute.PreCacheAgent;
import com.altvil.aro.service.cu.version.VersionTracking;
import com.altvil.aro.service.cu.version.VersionTrackingService;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.aro.service.cu.version.spi.DefaultVersionTracking;
import com.altvil.aro.service.cu.version.spi.VersionTrackingPersistence;
import org.springframework.stereotype.Service;

@Service
public class VersionTrackingServiceImpl implements VersionTrackingService {

	private ApplicationContext appCtx;
	private Ignite ignite;
	// private ApplicationInfo appInfo;
	private AroExecutorService bsaExecutorService;

	private Map<VersionType, VersionTracking> map = new EnumMap<>(
			VersionType.class);

	@Autowired
	public VersionTrackingServiceImpl(ApplicationContext appCtx, Ignite ignite,
			 AroExecutorService bsaExecutorService) {
		super();
		this.appCtx = appCtx;
		this.ignite = ignite;
		this.bsaExecutorService = bsaExecutorService;
	}

	@Override
	public Set<VersionType> getVersionTypes() {
		return map.keySet();
	}

	@Override
	public VersionTracking getVersionTracking(VersionType type) {
		return map.get(type);
	}

	@PostConstruct
	void postConstruct() {
		map.put(VersionType.LOCATION,
				createVersionTracking(VersionType.LOCATION));
		map.put(VersionType.NETWORK,
				createVersionTracking(VersionType.NETWORK));

		map.put(VersionType.SERVICE,
				createVersionTracking(VersionType.SERVICE));

		for (VersionTracking tracking : map.values()) {
			if (tracking != null) {
				bsaExecutorService.register((PreCacheAgent) tracking);
			}
		}

	}

	private DefaultVersionTracking createVersionTracking(VersionType vt) {
		return new DefaultVersionTracking(ignite, vt, createPersistence(vt));
	}

	private VersionTrackingPersistence createPersistence(VersionType vt) {
		switch (vt) {
		case NETWORK:
			return DeploymentVersionTracking.create(appCtx);
		default:
			return new StubVersionTracking();

		}

	}

}
