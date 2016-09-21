package com.altvil.aro.service.cu.execute.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import com.altvil.aro.service.cu.execute.AroExecutorService;
import com.altvil.aro.service.cu.execute.PreCacheAgent;
import com.altvil.aro.service.cu.execute.Priority;
import com.altvil.aro.service.cu.execute.PriorityThreadPoolExecutor;
import org.springframework.stereotype.Service;

@Service
public class AroExecutorServiceImpl implements AroExecutorService {

	private static final Logger log = LoggerFactory
			.getLogger(AroExecutorServiceImpl.class.getName());

	private final boolean preCacheEnabled;

	private Map<Priority, Executor> executorMap = new EnumMap<>(Priority.class);
	private Map<Priority, Executor> preCacheExecutor = new EnumMap<>(
			Priority.class);

	private ScheduledExecutorService scheduledExecutorService;
	private AtomicBoolean started = new AtomicBoolean();
	private List<PreCacheAgent> preCacheAgents = Collections
			.synchronizedList(new ArrayList<>());

	@Autowired
	public AroExecutorServiceImpl(
			@Value("${pre-cache-enabled}") boolean preCacheEnabled,
			@Value("${priority_queue_thread_count}") int priorityQueueThreadCount,
			@Value("${pre-cache_concurrency-count}") int preCacheThreadCount) {

		this.preCacheEnabled = preCacheEnabled;

		executorMap = createExecutor(priorityQueueThreadCount);
		preCacheExecutor = createExecutor(preCacheThreadCount);

		scheduledExecutorService = Executors.newScheduledThreadPool(3);

	}

	@PostConstruct
	private void init() {
		if (preCacheEnabled) {
			scheduledExecutorService.scheduleWithFixedDelay(
					this::preCacheMaintenance, 50, 10, TimeUnit.SECONDS);
		}
	}

	private Map<Priority, Executor> createExecutor(int threadCount) {
		PriorityThreadPoolExecutor executor = new PriorityThreadPoolExecutor(
				threadCount, threadCount, 1000L, TimeUnit.SECONDS);

		Map<Priority, Executor> executorMap = new EnumMap<>(Priority.class);

		for (Priority p : Priority.values()) {
			executorMap.put(p, new ProxyExecutor(executor, p));
		}

		return executorMap;

	}

	private void preCacheMaintenance() {
		if (!started.get()) {
			started.set(true);
			log.info("Init  PreCache");
			
			//TODO enable precaching
			
//			if (appInfo.getProcessNodeType() == ProcessNodeType.MASTER) {
//				log.info("Starting  PreCache  Agents");
//				for (PreCacheAgent agent : preCacheAgents) {
//					try {
//						agent.startPreCaching(this);
//					} catch (Throwable err) {
//						log.error(err.getMessage(), err);
//					}
//				}
//				log.info("Started  PreCache  Agents");
//
//			}
		}
	}

	@Override
	public Executor getPreCacheExecutor(Priority priority) {
		return preCacheExecutor.get(priority);
	}

	@Override
	public void register(PreCacheAgent preCacheAgent) {
		preCacheAgents.add(preCacheAgent);
		if (started.get()) {
			preCacheAgent.startPreCaching(this);
		}
	}

	@Override
	public ScheduledExecutorService getScheduledExecutorService() {
		return scheduledExecutorService;
	}

	@Override
	public Executor getDatabaseExecutor(Priority priority) {
		return executorMap.get(priority);
	}

	private static class ProxyExecutor implements Executor {

		private PriorityThreadPoolExecutor priorityThreadPoolExecutor;
		private Priority priority;

		public ProxyExecutor(
				PriorityThreadPoolExecutor priorityThreadPoolExecutor,
				Priority priority) {
			super();
			this.priorityThreadPoolExecutor = priorityThreadPoolExecutor;
			this.priority = priority;
		}

		@Override
		public void execute(Runnable command) {
			priorityThreadPoolExecutor.submit(priority, command);
		}

	}

}
