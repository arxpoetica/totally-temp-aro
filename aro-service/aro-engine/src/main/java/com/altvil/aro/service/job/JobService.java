package com.altvil.aro.service.job;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.Future;

import com.altvil.aro.service.job.Job.Id;

public interface JobService {
	Collection<Job<?>> getRemainingJobs();
	<T> Job<T> add(Map<String, Object>metaId, Future<T> future);
	<T> Job<T> add(Future<T> future);
	<T> Job<T> get(Id id);
}
