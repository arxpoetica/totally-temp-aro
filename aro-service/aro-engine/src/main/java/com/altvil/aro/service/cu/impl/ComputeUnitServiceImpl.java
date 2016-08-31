package com.altvil.aro.service.cu.impl;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCompute;
import org.apache.ignite.cache.CacheMode;
import org.apache.ignite.compute.ComputeTaskFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import com.altvil.aro.service.cu.ComputeUnit;
import com.altvil.aro.service.cu.ComputeUnitBuilder;
import com.altvil.aro.service.cu.ComputeUnitService;
import com.altvil.aro.service.cu.ComputeUnitFunction;
import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.cache.CacheHandle;
import com.altvil.aro.service.cu.cache.CacheStrategy;
import com.altvil.aro.service.cu.cache.SimpleCache;
import com.altvil.aro.service.cu.cache.SimpleCacheService;
import com.altvil.aro.service.cu.cache.impl.DefaultCacheKey;
import com.altvil.aro.service.cu.cache.query.CacheKey;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.AroExecutorService;
import com.altvil.aro.service.cu.execute.JobProgressListener;
import com.altvil.aro.service.cu.execute.PreCacheAgent;
import com.altvil.aro.service.cu.execute.Priority;
import com.altvil.aro.service.cu.execute.SpiAroExecutorContext;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.resource.CompositeVersion;
import com.altvil.aro.service.cu.resource.ResourceVersion;
import com.altvil.aro.service.cu.spi.SpiComputeUnit;
import com.altvil.aro.service.cu.version.VersionChangedListener;
import com.altvil.aro.service.cu.version.VersionEvent;
import com.altvil.aro.service.cu.version.VersionTrackingService;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.utils.lock.ResourceLock;

public class ComputeUnitServiceImpl  implements ComputeUnitService {
	private static final Logger log = LoggerFactory
			.getLogger(ComputeUnitServiceImpl.class.getName());
	private Ignite ignite;
	private SimpleCacheService simpleCacheService;
	private VersionTrackingService versionTrackingService;
	private SpiAroExecutorContext gridExecutorContext;

	private ConcurrentHashMap<String, ComputeUnit<?>> bsaExecutors = new ConcurrentHashMap<>();;

	private Executor dbCacheWriterService;
	private AroExecutorService bsaExecutorService;
	private boolean jobHandleErrorsEnabled;
	private int largeTask = 25;

	private ComputeUnitHandlerFactory handlerFactory;

	@Autowired
	public ComputeUnitServiceImpl(
			Ignite ignite,
			SimpleCacheService simpleCacheService,
			VersionTrackingService versionTrackingService,
			AroExecutorService bsaExecutorService,
			SpiAroExecutorContext gridExecutorContext,
			@Value("${job-handle-errors-enabled}") boolean jobHandleErrorsEnabled) {
		super();
		this.ignite = ignite;
		this.bsaExecutorService = bsaExecutorService;
		this.simpleCacheService = simpleCacheService;
		this.versionTrackingService = versionTrackingService;
		this.gridExecutorContext = gridExecutorContext;
		this.jobHandleErrorsEnabled = jobHandleErrorsEnabled;

		this.dbCacheWriterService = bsaExecutorService
				.getDatabaseExecutor(Priority.LOW);

		handlerFactory = new ComputeUnitHandlerFactory();

	}

	@Override
	public <T extends Serializable> ComputeUnitBuilder<T> build(Class<T> clz,
			Class<? extends ComputeServiceApi> serviceApi) {
		return new TrackingCacheBuilderIml<T>(clz, serviceApi);
	}

	@Override
	public ComputeUnit<?> getBsaExecutor(String name) {
		return bsaExecutors.get(name);
	}

	private interface ManagedCache<T extends Serializable> {
		T load(CacheQuery cachKey);
	}

	private static class ExecutorContext<T extends Serializable> {

		private Class<T> clz;
		private String cacheType;
		private Set<VersionType> versionTypes;
		private Function<CacheQuery, ComputeUnitFunction<T>> cacheLoaderFunc;

		public ExecutorContext(Class<T> clz, String cacheType,
				Set<VersionType> versionTypes,
				Function<CacheQuery, ComputeUnitFunction<T>> cacheLoaderFunc,
				VersionTrackingService versionTrackingService) {
			super();
			this.clz = clz;
			this.cacheType = cacheType;
			this.versionTypes = versionTypes;
			this.cacheLoaderFunc = cacheLoaderFunc;
		}

		public Class<T> getClz() {
			return clz;
		}

		public String getCacheType() {
			return cacheType;
		}

		public Set<VersionType> getVersionTypes() {
			return versionTypes;
		}

		public Function<CacheQuery, ComputeUnitFunction<T>> getCacheLoaderFunc() {
			return cacheLoaderFunc;
		}

	}

	private class TrackingCacheBuilderIml<T extends Serializable> implements
			ComputeUnitBuilder<T> {

		private Class<T> clz;
		private String cacheType;
		private Class<? extends ComputeServiceApi> serviceApi;
		private CacheMode cacheMode = CacheMode.PARTITIONED;
		private boolean memoryStoreAsBinary = false;

		private Set<VersionType> versionTypes;
		private Function<CacheQuery, ComputeUnitFunction<T>> cacheLoaderFunc;
		private Set<ExecutionCachePolicy> cachePolicies = EnumSet.of(
				ExecutionCachePolicy.MEMORY, ExecutionCachePolicy.PERSISTENCE);
		private CacheStrategy cacheStrategy;
		private int memorySize = 500;

		public TrackingCacheBuilderIml(Class<T> clz,
				Class<? extends ComputeServiceApi> serviceApi) {
			super();
			this.clz = clz;
			this.serviceApi = serviceApi;
		}

		private ManagedCache<T> createManagedCache(ExecutorContext<T> ctx) {

			boolean memoryCache = cachePolicies
					.contains(ExecutionCachePolicy.MEMORY);
			boolean persistenceCache = cachePolicies
					.contains(ExecutionCachePolicy.PERSISTENCE);

			if (memoryCache && persistenceCache) {
				return new CompositeManagedCache<T>(handlerFactory, ctx,
						simpleCacheService.createMemoryCache(cacheType,
								memorySize, cacheMode, memoryStoreAsBinary),
						simpleCacheService.createPersistenceCache(cacheType));
			}

			if (memoryCache) {
				return new SingleCache<T>(handlerFactory, ctx,
						simpleCacheService.createMemoryCache(cacheType,
								memorySize, cacheMode, memoryStoreAsBinary));
			}

			if (persistenceCache) {
				return new SingleCache<T>(handlerFactory, ctx,
						simpleCacheService.createPersistenceCache(cacheType));
			}

			return new BasicExecutor<>(ctx);
		}

		@Override
		public ComputeUnitBuilder<T> setCacheMemoryBinary(boolean storeAsBinary) {
			memoryStoreAsBinary = storeAsBinary;
			return this;
		}

		@Override
		public ComputeUnitBuilder<T> setVersionTypes(Set<VersionType> versionTypes) {
			this.versionTypes = versionTypes;
			return this;
		}

		@Override
		public ComputeUnitBuilder<T> setExecutionCachePolicies(
				Set<ExecutionCachePolicy> policies) {
			this.cachePolicies = policies;
			return this;
		}

		@Override
		public ComputeUnitBuilder<T> setCacheMemorySize(int memorySize) {
			this.memorySize = memorySize;
			return this;
		}

		@Override
		public ComputeUnitBuilder<T> setCacheLoaderFunc(
				Function<CacheQuery, ComputeUnitFunction<T>> cacheLoader) {
			this.cacheLoaderFunc = cacheLoader;
			return this;
		}

		@Override
		public ComputeUnitBuilder<T> setName(String name) {
			this.cacheType = name;
			return this;
		}

		@Override
		public ComputeUnitBuilder<T> setCacheStrategy(CacheStrategy cacheStrategy) {
			this.cacheStrategy = cacheStrategy;
			return this;
		}

		@Override
		public ComputeUnit<T> build() {

			ExecutorContext<T> ctx = new ExecutorContext<T>(clz, cacheType,
					versionTypes, cacheLoaderFunc, versionTrackingService);

			TrackingCacheImpl<T> tc = new TrackingCacheImpl<T>(ctx, serviceApi,
					createManagedCache(ctx), cacheStrategy, ignite.compute());

			bsaExecutors.put(cacheType, tc);
			bsaExecutorService.register(tc);

			return tc;
		}
	}

	private class TrackingCacheImpl<T extends Serializable> implements
			ComputeUnit<T>, SpiComputeUnit, VersionChangedListener,
			PreCacheAgent {

		private ExecutorContext<T> executorContext;
		private Class<? extends ComputeServiceApi> serviceApi;
		private ManagedCache<T> managedCache;
		private CacheStrategy cacheStrategy;
		private IgniteCompute igniteCompute;
		
		private Map<AroKey, Date> lastUpdatedPreCacheKey = Collections.synchronizedMap(new HashMap<>()) ;

		public TrackingCacheImpl(ExecutorContext<T> executorContext,
				Class<? extends ComputeServiceApi> serviceApi,
				ManagedCache<T> managedCache, CacheStrategy cacheStrategy,
				IgniteCompute igniteCompute) {
			super();
			this.executorContext = executorContext;
			this.serviceApi = serviceApi;
			this.managedCache = managedCache;
			this.cacheStrategy = cacheStrategy;
			this.igniteCompute = igniteCompute;
		}
		
		
		private boolean canPreCache(VersionEvent versionEvent) {
			if (versionEvent.getVersionType() == VersionType.LOCATION
					&& executorContext.getVersionTypes().size() == 1) {
				Long id = versionEvent.getKey().getDeploymentPlanId();
				if (!(id == null || id == -1)) {
					return false;
				}
				
				Date date = lastUpdatedPreCacheKey.get(versionEvent.getKey()) ;
				Date now  = new Date() ;
				
				if( date != null ) {
					
					Long millis = now.getTime() - date.getTime() ;
					if( millis < (1000L * 60L * 5L) ) {
						return false ;
					}
				}
				lastUpdatedPreCacheKey.put(versionEvent.getKey(), now) ;
				
			}
			
			return true ;
		}

		@Override
		public void startPreCaching(AroExecutorService executorService) {
			log.info("Starting Pre Caching on " + getName());

			if (cacheStrategy != null) {
				for (VersionType vt : executorContext.getVersionTypes()) {
					versionTrackingService.getVersionTracking(vt)
							.addVersionChangedListener(this);
				}

				Collection<CacheQuery> cacheQueries = cacheStrategy
						.getPreCacheQueries();
				log.info("Pre Cache " + getName() + " Count="
						+ cacheQueries.size());

				cacheQueries.forEach(query -> {
					bsaExecutorService.getPreCacheExecutor(Priority.LOW)
							.execute(
									() -> {
										log.info("Pre Cache Load Request "
												+ getName() + ":"
												+ query.toString());
										gridLoad(Priority.LOW, query);
									});
				});

			}

		}

		@Override
		public void stopPreCaching(AroExecutorService executorService) {

		}

		@Override
		public void versionChanged(VersionEvent versionEvent) {
			
			if( canPreCache(versionEvent)) {
				bsaExecutorService.getPreCacheExecutor(Priority.HIGH).execute(
						() -> {
							log.info("Pre Cache " + executorContext + " "
									+ versionEvent.getKey().toString());
							gridLoad(Priority.LOW, cacheStrategy
									.toCacheQuery(versionEvent.getKey()));
						});
			}
		}

		@Override
		public String getName() {
			return executorContext.getCacheType();
		}

		@Override
		public Collection<T> gridLoad(Priority priority,
				Collection<CacheQuery> queries, boolean handleErrors) {

			if (gridExecutorContext.isInGridContext()) {
				return queries.stream().map(this::_nodeLoad)
						.collect(Collectors.toList());
			}

			if (isLargeTask(queries)) {

				ErrorHandelingJobListener<T> listener = new ErrorHandelingJobListener<>();
				ComputeTaskFuture<?> f = gridLoad(priority, queries.iterator(),
						listener);
				f.get();

				if (!listener.isValid()) {
					throw new RuntimeException(
							"Compute Tasks Failed check logs");
				}

				return listener.getResults();

			} else {
				return igniteCompute.execute(gridExecutorContext
						.createComputeJob(this, priority, serviceApi), queries);

			}

		}

		private boolean isLargeTask(Collection<CacheQuery> queries) {
			return queries.size() >= largeTask;
		}

		@Override
		public Collection<T> gridLoad(Priority priority,
				Collection<CacheQuery> queries) {
			return gridLoad(priority, queries, jobHandleErrorsEnabled);
		}

		@Override
		public ComputeTaskFuture<?> gridLoad(Priority priority,
				Iterator<CacheQuery> itr, JobProgressListener<T> listener) {

			IgniteCompute asyncCompute = igniteCompute.withAsync();
			asyncCompute.execute(gridExecutorContext.createComputeJob(this,
					priority, serviceApi, listener), itr);
			return asyncCompute.future();

		}

		public T _nodeLoad(CacheQuery query) {
			return managedCache.load(query);
		}

		@Override
		public Object nodeLoad(CacheQuery query) {
			return managedCache.load(query);
		}

		@Override
		public T gridLoad(Priority priority, CacheQuery cacheQuery) {
			return gridLoad(priority, Collections.singleton(cacheQuery))
					.iterator().next();
		}

	}

	private abstract class AbstractManagedCache<T extends Serializable>
			implements ManagedCache<T> {

		protected ExecutorContext<T> executorContext;
		protected ResourceLock<CacheKey> locker = new ResourceLock<>();

		public AbstractManagedCache(ExecutorContext<T> executorContext) {
			super();
			this.executorContext = executorContext;
		}

		protected T _load(CacheQuery query) {
			return executorContext.getCacheLoaderFunc().apply(query).load();
		}

		public ResourceVersion getResourceVersion(AroKey bsaKey) {

			Map<VersionType, Long> map = new EnumMap<>(VersionType.class);
			for (VersionType vt : executorContext.getVersionTypes()) {
				Long version = versionTrackingService.getVersionTracking(vt)
						.getVersion(bsaKey);
				map.put(vt, version);
			}

			return new CompositeVersion(map);
		}

		public CacheKey createCacheKey(CacheQuery query) {
			return new DefaultCacheKey(executorContext.getCacheType(),
					query.getAroKey(), query.getExtentionKey());
		}
	}

	private class BasicExecutor<T extends Serializable> extends
			AbstractManagedCache<T> {

		public BasicExecutor(ExecutorContext<T> executorContext) {
			super(executorContext);
		}

		@Override
		public T load(CacheQuery query) {
			return _load(query);
		}

	}

	private abstract class AbstractCacheExecutor<T extends Serializable>
			extends AbstractManagedCache<T> {

		private ComputeUnitHandlerFactory factory;

		public AbstractCacheExecutor(ComputeUnitHandlerFactory factory,
				ExecutorContext<T> executorContext) {
			super(executorContext);
			this.factory = factory;
		}

		public T load(CacheQuery query) {
			CacheKey key = createCacheKey(query);

			try (ComputeUnitHandler<T> handler = factory.create(
					executorContext, query, createCacheKey(query),
					getResourceVersion(key.getBsaKey()))) {
				return load(handler);
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				throw new RuntimeException(err.getMessage(), err);
			}
		}

		protected abstract T load(ComputeUnitHandler<T> handler);
	}

	private class SingleCache<T extends Serializable> extends
			AbstractCacheExecutor<T> {

		private SimpleCache simpleCache;

		public SingleCache(ComputeUnitHandlerFactory factory,
				ExecutorContext<T> executorContext, SimpleCache persistenceCache) {
			super(factory, executorContext);
			this.simpleCache = persistenceCache;
		}

		@Override
		protected T load(ComputeUnitHandler<T> handler) {
			return locker.read(handler.getCacheKey(), () -> {

				CacheHandle handle = handler.createHandle(false, simpleCache);

				T value = handle.tryRead(executorContext.getClz());
				if (value != null) {
					return value;
				}

				T newValue = handler.compute();
				handle.write(newValue);
				return newValue;
			});
		}
	}

	private class CompositeManagedCache<T extends Serializable> extends
			AbstractCacheExecutor<T> {

		private SimpleCache memoryCache;
		private SimpleCache persistenceCache;

		public CompositeManagedCache(ComputeUnitHandlerFactory factory,
				ExecutorContext<T> executorContext, SimpleCache memoryCache,
				SimpleCache persistenceCache) {
			super(factory, executorContext);
			this.memoryCache = memoryCache;
			this.persistenceCache = persistenceCache;
		}

		@Override
		protected T load(ComputeUnitHandler<T> handler) {
			return locker
					.read(handler.getCacheKey(),
							() -> {

								CacheHandle memoryHandle = handler
										.createHandle(false, memoryCache);

								T value = memoryHandle.tryRead(executorContext
										.getClz());

								if (value != null) {
									return value;
								}

								CacheHandle persistenceHandle = handler
										.createHandle(true,
												this.persistenceCache);

								value = persistenceHandle
										.tryRead(executorContext.getClz());
								if (value != null) {
									memoryHandle.write(value);
									return value;
								}

								T newValue = handler.compute();
								memoryHandle.write(newValue);

								dbCacheWriterService.execute(() -> {
									try {
										persistenceHandle.write(newValue);
									} catch (Exception e) {
										log.error(e.getMessage(), e);
										throw e;
									}
								});
								return newValue;

							});

		}

	}

	private interface ComputeUnitHandler<T extends Serializable> extends
			AutoCloseable {
		CacheKey getCacheKey();

		CacheHandle createHandle(boolean asyncWriter, SimpleCache cache);

		T compute();
	}

	private class ComputeUnitHandlerImpl<T extends Serializable> implements
			ComputeUnitHandler<T>, ComputeUnitEventListener {

		private ExecutorContext<T> ctx;
		private CacheQuery cacheQuery;
		private CacheKey cacheKey;
		private ResourceVersion resourceVersion;

		private long startTime;
		private long endTime;
		private List<ComputeUnitEvent> events = new ArrayList<>();

		public ComputeUnitHandlerImpl(ExecutorContext<T> ctx,
				CacheQuery cacheQuery, CacheKey cacheKey,
				ResourceVersion resourceVersion) {
			super();
			this.ctx = ctx;
			this.cacheQuery = cacheQuery;
			this.cacheKey = cacheKey;
			this.resourceVersion = resourceVersion;
			startTime = System.currentTimeMillis();
		}

		@Override
		public CacheKey getCacheKey() {
			return cacheKey;
		}

		@Override
		public void onEvent(ComputeUnitEvent event) {
			events.add(event);
		}

		@Override
		public void onAsyncEvent(ComputeUnitEvent event) {
			log.info(format("Async CU Event", Collections.singleton(event)));
		}

		@Override
		public CacheHandle createHandle(boolean asyncWriter, SimpleCache cache) {

			long startTime = System.currentTimeMillis();
			CacheHandle handle = cache.createCacheHandle(cacheKey,
					resourceVersion);
			onEvent(new CacheEvent(ComputeEventType.CREATE_HANDLE,
					System.currentTimeMillis() - startTime, cache));

			return new ComputeEventCacheHandler(this, cache, handle,
					asyncWriter);
		}

		@Override
		public T compute() {
			long startTime = System.currentTimeMillis();
			boolean inError = true;
			try {
				T value = ctx.getCacheLoaderFunc().apply(cacheQuery).load();
				inError = false;
				return value;
			} finally {
				new ComputeEvent(ComputeEventType.COMPUTE,
						System.currentTimeMillis() - startTime, inError);
			}
		}

		private long getTotalTime() {
			return endTime - startTime;
		}

		private String format(String hdr, Collection<ComputeUnitEvent> events) {
			StringBuffer sb = new StringBuffer();
			sb.append(hdr);
			sb.append(ctx.getCacheType());
			sb.append("/");
			sb.append(cacheKey.getBsaKey());
			sb.append(" time=");
			sb.append(getTotalTime());
			sb.append(" (");

			int i = 0;
			for (ComputeUnitEvent e : events) {
				if (i++ > 0) {
					sb.append(" ");
				}
				e.format(sb);
			}
			sb.append(" )");

			return sb.toString();
		}

		private String format() {
			return format("CU ", events);
		}

		@Override
		public void close() throws Exception {
			endTime = System.currentTimeMillis();
			log.info(format());
		}

	}

	private enum ComputeEventType {
		CREATE_HANDLE("CH"), CACHE_HIT("H"), CACHE_MISS("M"), WRITE("W"), COMPUTE(
				"C");
		private String code;

		private ComputeEventType(String code) {
			this.code = code;
		}

		public String getCode() {
			return code;
		}
	}

	private static class ComputeUnitEvent {
		private ComputeEventType eventType;
		private long timeTaken;

		public ComputeUnitEvent(ComputeEventType eventType, long timeTaken) {
			super();
			this.eventType = eventType;
			this.timeTaken = timeTaken;
		}

		public void format(StringBuffer sb) {
			sb.append(eventType.getCode());
			formatContext(sb);
			sb.append("=");
			sb.append(timeTaken);
		}

		protected void formatContext(StringBuffer sb) {

		}

		public String toString() {
			StringBuffer sb = new StringBuffer();
			format(sb);
			return sb.toString();
		}
	}

	private static class ComputeEvent extends ComputeUnitEvent {
		private boolean inError;

		public ComputeEvent(ComputeEventType eventType, long timeTaken,
				boolean inError) {
			super(eventType, timeTaken);
			this.inError = inError;
		}

		@Override
		protected void formatContext(StringBuffer sb) {
			if (inError) {
				sb.append(":Error");
			}
		}

	}

	private static class CacheEvent extends ComputeUnitEvent {
		private SimpleCache simpleCache;

		public CacheEvent(ComputeEventType eventType, long timeTaken,
				SimpleCache simpleCache) {
			super(eventType, timeTaken);
			this.simpleCache = simpleCache;
		}

		@Override
		protected void formatContext(StringBuffer sb) {
			sb.append(":");
			sb.append(simpleCache.getCacheType().getCode());
		}
	}

	private static class AsyncCacheEvent extends ComputeUnitEvent {
		private SimpleCache simpleCache;
		private long writeTime;

		public AsyncCacheEvent(ComputeEventType eventType, long timeTaken,
				SimpleCache simpleCache, long writeTime) {
			super(eventType, timeTaken);
			this.writeTime = writeTime;
			this.simpleCache = simpleCache;
		}

		@Override
		protected void formatContext(StringBuffer sb) {
			sb.append(":");
			sb.append(simpleCache.getCacheType().getCode());
			sb.append("(");
			sb.append("writeTime=");
			sb.append(writeTime);
			sb.append(")");
		}
	}

	private interface ComputeUnitEventListener {
		void onEvent(ComputeUnitEvent event);

		void onAsyncEvent(ComputeUnitEvent event);
	}

	private class ComputeEventCacheHandler implements CacheHandle {

		private ComputeUnitEventListener listener;
		private SimpleCache simpleCache;
		private CacheHandle cacheHandle;
		private boolean asyncWriter;

		public ComputeEventCacheHandler(ComputeUnitEventListener listener,
				SimpleCache simpleCache, CacheHandle cacheHandle,
				boolean asyncWriter) {
			super();
			this.listener = listener;
			this.simpleCache = simpleCache;
			this.cacheHandle = cacheHandle;
			this.asyncWriter = asyncWriter;
		}

		@Override
		public CacheKey getCacheKey() {
			return cacheHandle.getCacheKey();
		}

		@Override
		public <T> T tryRead(Class<T> clz) {
			long startTime = System.currentTimeMillis();
			T value = cacheHandle.tryRead(clz);
			listener.onEvent(new CacheEvent(
					value == null ? ComputeEventType.CACHE_MISS
							: ComputeEventType.CACHE_HIT, System
							.currentTimeMillis() - startTime, simpleCache));
			return value;
		}

		@Override
		public <T> void write(T value) {
			if (asyncWriter) {
				long startTime = System.currentTimeMillis();
				dbCacheWriterService.execute(() -> {
					try {
						long startWriteTime = System.currentTimeMillis();
						cacheHandle.write(value);
						long endTime = System.currentTimeMillis();
						listener.onAsyncEvent(new AsyncCacheEvent(
								ComputeEventType.WRITE, endTime - startTime,
								simpleCache, startWriteTime - endTime));

					} catch (Exception e) {
						log.error(e.getMessage(), e);
					}
				});

			} else {
				long startTime = System.currentTimeMillis();
				cacheHandle.write(value);
				listener.onEvent(new CacheEvent(ComputeEventType.WRITE, System
						.currentTimeMillis() - startTime, simpleCache));
			}
		}

	}

	private class ComputeUnitHandlerFactory {

		public <T extends Serializable> ComputeUnitHandler<T> create(
				ExecutorContext<T> ctx, CacheQuery cacheQuery, CacheKey key,
				ResourceVersion version) {
			return new ComputeUnitHandlerImpl<T>(ctx, cacheQuery, key, version);
		}

	}

}
