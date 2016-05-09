package com.altvil.aro.service.job.impl;


import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.Serializable;
import java.security.Principal;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Map;
//import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import javax.annotation.Resource;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCompute;
import org.apache.ignite.lang.IgniteCallable;
import org.apache.ignite.lang.IgniteFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.GenericHttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.job.impl.JobIdImpl;

@Service
public class JobServiceImpl implements JobService {

	private static final Logger log = LoggerFactory
			.getLogger(JobServiceImpl.class.getName());

	// NOTE: JobAdapter<T> can NOT implement Callable<T> as that triggers Servlet 3 Async response logic,
	public class JobAdapter<T> implements Serializable, Job<T> {
		private static final long serialVersionUID = 1L;

		private Date	   completedTime;
		private Principal creator;
		private IgniteFuture<T> future;
		private final Job.Id	   id;
		private final Date scheduledTime;
		private  Date startedTime;
		
		JobAdapter(final Builder<T> builder) {
			scheduledTime = new Date();
			startedTime = null;
			completedTime = null;

			id = new JobIdImpl(builder.getMetaIdentifiers());
			creator = builder.getCreator();
			final IgniteCallable<T> callable = builder.getCallable();
			IgniteCompute innerComputeGrid = builder.getComputeGrid();
			if (null == innerComputeGrid) {
				innerComputeGrid = defaultServiceGrid.compute();
			}
			innerComputeGrid = innerComputeGrid.withAsync();
			
			innerComputeGrid.call(callable);
			future = innerComputeGrid.future();
			future.listen(f -> {
					Calendar computeCalendar = GregorianCalendar.getInstance();
					computeCalendar.setTimeInMillis(f.startTime());
					startedTime = computeCalendar.getTime();
					computeCalendar.setTimeInMillis(f.startTime() + f.duration());
					completedTime = computeCalendar.getTime();

					// Done async so that any futures associated with this task will be marked as done before serializing the task over JMS.
					ForkJoinPool.commonPool().execute((Runnable) (() -> {announceCompletion();}));
				});
		}
		
		private void announceCompletion() {
			try {
				String msg;
				if (messageConverter.canWrite(getClass(), MediaType.APPLICATION_JSON)) {
					HttpOutputMessage outputMessage = new HttpOutputMessage() {
						ByteArrayOutputStream baos = new ByteArrayOutputStream();
	
						@Override
						public OutputStream getBody() throws IOException {
							return baos;
						}
	
						@Override
						public HttpHeaders getHeaders() {
							return new HttpHeaders();
						}
					
						public String toString() {
							return baos.toString();
						}
					};
					messageConverter.write(JobAdapter.this, MediaType.APPLICATION_JSON, outputMessage);
					msg = outputMessage.toString();
				} else {
					msg = JobAdapter.this.toString();
				}
				if (null == messagingTemplate)
					log.warn("messagingTemplate was null, so no completion announcement will be sent to user");
				else
					messagingTemplate.convertAndSendToUser(creator.getName(), "/topic/jobs", msg);
			} catch (HttpMessageNotWritableException | MessagingException | IOException e) {
				log.error("Error attempting to announce job completion. ", e);
			}
		}

		@Override
		public boolean cancel(boolean mayInterruptIfRunning) {
			if (future.isDone()) return false;
			
			return mayInterruptIfRunning ? future.cancel() : false;
		}

		@Override
		public T get() throws InterruptedException, ExecutionException {
			return future.get();
		}
		@Override
		public T get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
			return future.get(timeout, unit);
		}
		@Override
		public Date getCompletedTime() {
			return completedTime;
		}
		@Override
		public Principal getCreator() {
			return creator;
		}
		@Override
		public Id getId() {
			return id;
		}

		@Override
		public Date getScheduledTime() {
			return scheduledTime;
		}

		@Override
		public Date getStartedTime() {
			return startedTime;
		}

		void initCompletedTime() {
			completedTime = new Date();
		}

		@Override
		public boolean isCancelled() {
			return future.isCancelled();
		}

		@Override
		public boolean isDone() {
			return future.isDone();
		}

		void setStartedTime(Date startedTime) {
			this.startedTime = startedTime;
		}

		public String toString() {
			return Job.class.getSimpleName() + "(id: " + getId() + ", creator: " + creator + ", isDone: " + future.isDone() + ", isCancelled: "
					+ future.isCancelled() + ")";
		}
	}

	private static final Logger	LOG	= LoggerFactory.getLogger(JobServiceImpl.class.getName());
	
	private Ignite defaultServiceGrid;
	
	@Autowired  //NOTE the method name determines the name/alias of Ignite grid which gets bound!
	private void setJobServiceIgniteGrid(Ignite igniteBean)
	{
		defaultServiceGrid = igniteBean;
	}	
	
	private Map<Job.Id, Job<?>>	map	= Collections.synchronizedMap(new HashMap<>());
	
	@Resource(name="jsonMessageConverter")
	private GenericHttpMessageConverter<Job<?>> messageConverter;

	@Autowired(required=false)
	@Qualifier("brokerMessagingTemplate")
	private SimpMessagingTemplate messagingTemplate;

	public JobServiceImpl() {
	}

	@SuppressWarnings("unchecked")
	@Override
	public Job<?> get(Job.Id id) {
		return map.get(id);
	}

	@Override
	public Collection<Job<?>> getRemainingJobs() {
		return new ArrayList<>(map.values());
	}	

	@Override
	public <T> Job<T> submit(Builder<T> builder) {
		JobAdapter<T> newJob = new JobAdapter<T>(builder);
		
		map.put(newJob.getId(), newJob);

		LOG.trace("{} added to service", newJob);
		
		return newJob;
	}
}
