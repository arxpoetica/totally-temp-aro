package com.altvil.aro.service.cu.key.impl;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.cu.cache.impl.AroCacheKey;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.key.AroKeyService;

@Service
public class AroKeyServiceImpl implements AroKeyService {

	@Override
	public AroKey createDeploymentKey(int serviceAreaId, long deploymentPlanId) {
		return AroCacheKey.create(serviceAreaId, deploymentPlanId);
	}

	@Override
	public AroKey createServiceAreaKey(int serviceAreaId) {
		return AroCacheKey.create(serviceAreaId);
	}


}