package com.altvil.aro.service.cu.execute;

import java.util.concurrent.Executor;
import java.util.concurrent.ScheduledExecutorService;

public interface AroExecutorService {

	Executor getDatabaseExecutor(Priority priority);

	Executor getPreCacheExecutor(Priority priority);

	void register(PreCacheAgent preCacheAgent);

	ScheduledExecutorService getScheduledExecutorService();

}
