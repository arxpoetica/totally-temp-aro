package com.altvil.aro.service.recalc.impl;

import com.altvil.aro.service.recalc.Job;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcJob;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;
import com.google.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Singleton
public class RecalcServiceImpl implements RecalcService {

	private static final Logger log = LoggerFactory
			.getLogger(RecalcServiceImpl.class.getName());

	private ExecutorService executorService;
	private AtomicLong jobId = new AtomicLong(0);
	
	private Map<Long, Job<?>> map = Collections
			.synchronizedMap(new HashMap<>());

	public RecalcServiceImpl() {
		int threadCount = getThreadCount();
		log.info("Thread Count " + threadCount);
		this.executorService = Executors.newFixedThreadPool(threadCount);
	}

	private int getThreadCount() {
		String value = "Not Configured Yet";
		if (value != null) {
			try {
				return Integer.parseInt(value);
			} catch (Throwable err) {
				if (log.isWarnEnabled())
					log.warn("Failed to pare " + value + " + using defaults");
			}
		}

		return 10; // default

	}

	@Override
	public Collection<Job<?>> getRemainingJobs() {
		return new ArrayList<>(map.values());
	}

	@Override
	public <T> Job<T> submit(Callable<T> task) throws RecalcException {
		RecalcJob recalcJob = toJob();
		JobImpl<T> job = new JobImpl<T>(recalcJob);
		map.put(recalcJob.getJobId(), job);
		job.setFuture(executorService.submit(new RecalcCommand<T>(recalcJob,
				task)));
		return job;
	}

	private void removeJob(RecalcJob job) {
		map.remove(job.getJobId());
	}

	private RecalcJob toJob() {
		RecalcJob job = new RecalcJob();

		job.setJobId(jobId.getAndIncrement());
		job.setScheduledTime(new Date());

		return job;
	}

	private  class JobImpl<T> implements Job<T> {

		private RecalcJob job;
		private Future<RecalcResponse<T>> future;

		public JobImpl(RecalcJob job) {
			super();
			this.job = job;
		}

		public void setFuture(Future<RecalcResponse<T>> future) {
			this.future = future;
		}

		@Override
		public RecalcJob getJob() {
			return job;
		}

		@Override
		public RecalcResponse<T> getResponse() {
			try {
				return future.get();
			} catch (Throwable e) {
				throw new RecalcException(e.getMessage(), e);
			}
		}

		@Override
		public void cancel() {
			future.cancel(false) ;
			removeJob(job) ;
		}

	}

	private class RecalcCommand<T> implements Callable<RecalcResponse<T>> {

		private RecalcJob job;
		private Callable<T> callable;

		public RecalcCommand(RecalcJob job, Callable<T> callable) {
			super();
			this.job = job;
			this.callable = callable;
		}

		@Override
		public RecalcResponse<T> call() throws Exception {

			log.info("Start Recalc on job : " + job.toString());

			RecalcResponse<T> response = new RecalcResponse<T>();
			response.setJob(job);

			long startTime = System.currentTimeMillis();

			try {
				response.setResult(callable.call());
				response.setSuccess(true);
				response.setMessage("Success");
			} catch (Throwable err) {
				response.setSuccess(false);
				response.setMessage(err.getMessage());
				log.error(err.getMessage(), err);

			} finally {
				response.setCompletedTime(new Date());
				response.setRunningTimeInMillis(System.currentTimeMillis()
						- startTime);

				removeJob(job);
			}
			log.info("Finish Recalc on job" + response.toString());

			return response;
		}
	}

}
