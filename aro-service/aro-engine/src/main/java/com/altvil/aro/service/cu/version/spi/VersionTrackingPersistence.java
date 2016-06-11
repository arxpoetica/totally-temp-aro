package com.altvil.aro.service.cu.version.spi;

import java.util.Collection;
import java.util.Date;

import com.altvil.aro.service.cu.key.AroKey;

public interface VersionTrackingPersistence {

	public Long loadVersion(AroKey bsaKey);

	Long incrementVersion(AroKey key);

	Long startVersionTracking(AroKey bsaKey);

	VersionUpdates checkDbForVersionChanges(Date lastDate);

	Collection<AroKey> getPlanKeys(AroKey key);

	Collection<AroKey> getAffectedKeys(AroKey bsaKey);

}
