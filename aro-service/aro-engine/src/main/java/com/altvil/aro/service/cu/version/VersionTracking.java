package com.altvil.aro.service.cu.version;

import com.altvil.aro.service.cu.key.AroKey;

public interface VersionTracking {

	AroKey createKey(int serviceAreaId, long planId);

	VersionType getVersionType();

	long getVersion(AroKey key);

	void invalidateVersion(AroKey key);

	void addVersionChangedListener(VersionChangedListener versionChangedListener);

	void removedVersionChangedListener(
			VersionChangedListener versionChangedListener);

}
