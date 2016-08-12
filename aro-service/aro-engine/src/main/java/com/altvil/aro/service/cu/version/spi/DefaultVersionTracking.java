package com.altvil.aro.service.cu.version.spi;

import java.util.Date;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.apache.ignite.configuration.CacheConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.PeriodicTrigger;

import com.altvil.aro.service.cu.cache.impl.AroCacheKey;
import com.altvil.aro.service.cu.execute.AroExecutorService;
import com.altvil.aro.service.cu.execute.PreCacheAgent;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.version.VersionChangedListener;
import com.altvil.aro.service.cu.version.VersionEvent;
import com.altvil.aro.service.cu.version.VersionTracking;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.utils.notify.NotificationHandler;

public class DefaultVersionTracking implements VersionTracking, PreCacheAgent {

	private static final Logger log = LoggerFactory
			.getLogger(DefaultVersionTracking.class.getName());

	private static final Date NULL_DATE = new Date(0L);
	private VersionType versionType;
	private VersionTrackingPersistence persistence;
	private NotificationHandler<VersionChangedListener, VersionEvent> notificationHandler = new NotificationHandler<>(
			(l, e) -> l.versionChanged(e));;

	private IgniteCache<AroKey, Long> versionCache;

	private AtomicReference<Date> lastDate = new AtomicReference<Date>(
			NULL_DATE);

	public DefaultVersionTracking(Ignite ignite, VersionType versionType,
			VersionTrackingPersistence persistence) {
		super();
		this.versionType = versionType;
		this.persistence = persistence;

		versionCache = createCache(ignite);
	}

	

	@Override
	public void startPreCaching(AroExecutorService executorService) {
		executorService.getScheduledExecutorService().scheduleAtFixedRate(
				this::checkForVersionChanges, 0, 1, TimeUnit.MINUTES);
	}

	@Override
	public void stopPreCaching(AroExecutorService executorService) {
	}

	private IgniteCache<AroKey, Long> createCache(Ignite ignite) {
		CacheConfiguration<AroKey, Long> cfg = new CacheConfiguration<>();
		cfg.setName("version" + "/" + versionType.name());
		cfg.setAtomicityMode(CacheAtomicityMode.ATOMIC);
		cfg.setCacheMode(CacheMode.REPLICATED);
		return ignite.getOrCreateCache(cfg);

	}

	public void trackDatabaseUpdates(TaskScheduler scheduler) {

		scheduler.schedule(this::checkForVersionChanges, new PeriodicTrigger(
				60L, TimeUnit.SECONDS));

	}

	protected void checkForVersionChanges() {
		try {
			Date lastUpdated = lastDate.get();

			VersionUpdates versionUpdates = persistence
					.checkDbForVersionChanges(lastUpdated);

			if (lastUpdated != NULL_DATE) {
				versionUpdates.getUpdates().entrySet().forEach(e -> {
					trackVersion(e.getKey(), e.getValue(), true);
				});

			}

			lastDate.set(versionUpdates.getLastUpdate());
		} catch (Throwable err) {
			log.error(err.getMessage(), err);
		}
	}

	@Override
	public AroKey createKey(int serviceAreaId, long planId) {
		return AroCacheKey.create(serviceAreaId, planId);
	}

	@Override
	public VersionType getVersionType() {
		return versionType;
	}

	public long getVersion(AroKey key) {

		key = key.toKey(versionType);

		Long version = versionCache.get(key);
		if (version == null) {
			version = persistence.loadVersion(key);
			if (version == null) {
				version = persistence.startVersionTracking(key);
			}
			updateVersionCache(key, version);
		}
		return version;
	}

	public void invalidateVersion(AroKey bsaKey) {
		persistence.getAffectedKeys(bsaKey).forEach(affectedKey -> {
			Long version = persistence.incrementVersion(affectedKey);
			if (version != null) {
				updateVersionCache(affectedKey, version);
				notifyListeners(affectedKey, version);
			}
		});
	}

	@Override
	public void addVersionChangedListener(
			VersionChangedListener versionChangedListener) {
		notificationHandler.addListener(versionChangedListener);
	}

	@Override
	public void removedVersionChangedListener(
			VersionChangedListener versionChangedListener) {
		notificationHandler.removeListener(versionChangedListener);
	}

	protected void notifyListeners(AroKey key, Long version) {
		notificationHandler.notify(new VersionEvent(key, versionType, version));
	}

	protected void trackVersion(AroKey key, Long version,
			boolean notifyListeners) {
		key = key.toKey(versionType);
		Long previousVersion = versionCache.get(key);
		if (previousVersion == null || version > previousVersion) {
			log.info("Detected Version Change on " + versionType + " key="
					+ key.toString());
			doUpdate(key, version, notifyListeners);
		}
	}

	private void doUpdate(AroKey key, Long version, boolean notifyListeners) {
		updateVersionCache(key.toKey(versionType), version);
		if (notifyListeners) {
			notifyListeners(key, version);
		}
	}

	protected void updateVersionCache(AroKey key, Long version) {

		versionCache.put(key, version);
	}

}