package com.altvil.aro.service.recalc.impl;

import java.util.Date;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.plan.RecalcRequest;
import com.altvil.aro.service.recalc.Job;
import com.altvil.aro.service.recalc.RecalcException;
import com.altvil.aro.service.recalc.RecalcService;
import com.altvil.aro.service.recalc.protocol.RecalcJob;
import com.altvil.aro.service.recalc.protocol.RecalcResponse;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Singleton
public class RecalcServiceImpl implements RecalcService {

	private static final Logger log = LoggerFactory
			.getLogger(RecalcServiceImpl.class.getName());

	private PlanService planService;
	private ExecutorService executorService;
	private AtomicLong jobId = new AtomicLong(0);

	@Inject
	public RecalcServiceImpl(PlanService planService) {
		this.planService = planService;
		this.executorService = Executors.newSingleThreadExecutor() ;
	}

	@Override
	public Job submit(RecalcRequest request) throws RecalcException {

		RecalcJob recalcJob = toJob(request);

		return new JobImpl(recalcJob, executorService.submit(new RecalcCommand(
				recalcJob)));
	}

	private RecalcJob toJob(RecalcRequest request) {
		RecalcJob job = new RecalcJob();

		job.setJobId(jobId.getAndIncrement());
		job.setRequest(request);
		job.setScheduledTime(new Date());

		return job;
	}

	private static class JobImpl implements Job {

		private RecalcJob job;
		private Future<RecalcResponse> future;

		public JobImpl(RecalcJob job, Future<RecalcResponse> future) {
			super();
			this.job = job;
			this.future = future;
		}

		@Override
		public RecalcJob getJob() {
			return job;
		}

		@Override
		public RecalcResponse getResponse() {
			try {
				return future.get();
			} catch (Throwable e) {
				throw new RecalcException(e.getMessage(), e);
			}
		}

	}

	
	private class RecalcCommand implements Callable<RecalcResponse> {

		private RecalcJob job;

		public RecalcCommand(RecalcJob job) {
			super();
			this.job = job;
		}

		@Override
		public RecalcResponse call() throws Exception {

			log.info("Start Recalc on job : " + job.toString());

			RecalcRequest request = job.getRequest();

			RecalcResponse response = new RecalcResponse();
			response.setJob(job);

			long startTime = System.currentTimeMillis();

			try {
				int updateCount = planService.computeNetworkNodes(
						request.getPlanId(),
						NetworkNodeType.fiber_distribution_terminal).size();

				response.setSuccess(true);
				response.setMessage("Updated FDTs = " + updateCount);

			} catch (Throwable err) {
				response.setSuccess(false);
				response.setMessage(err.getMessage());
			} finally {
				response.setCompletedTime(new Date());
				response.setRunningTimeInMillis(System.currentTimeMillis()
						- startTime);
			}

			log.info("Finish Recalc on job" + response.toString());

			return response;
		}
	}

}
