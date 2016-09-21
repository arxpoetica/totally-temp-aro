package com.altvil.aro.service.cu.version.impl;

import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.version.spi.VersionTrackingPersistence;
import com.altvil.aro.service.cu.version.spi.VersionUpdates;

import java.util.Collection;
import java.util.Collections;
import java.util.Date;

public class StubVersionTracking implements VersionTrackingPersistence {
    @Override
    public Long loadVersion(AroKey bsaKey) {
        return 1l;
    }

    @Override
    public Long incrementVersion(AroKey key) {
        return 1l;
    }

    @Override
    public Long startVersionTracking(AroKey bsaKey) {
        return 1l;
    }

    @Override
    public VersionUpdates checkDbForVersionChanges(Date lastDate) {
        return new VersionUpdates(Collections.emptyMap(), lastDate);
    }

    @Override
    public Collection<AroKey> getPlanKeys(AroKey key) {
        return Collections.emptyList();
    }

    @Override
    public Collection<AroKey> getAffectedKeys(AroKey bsaKey) {
        return Collections.emptyList();
    }
}
