package com.altvil.aro.service.job.impl;


import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;

import javax.annotation.Resource;

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

	private static final Logger	LOG	= LoggerFactory.getLogger(JobServiceImpl.class.getName());
	
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
	public <T> Job<T> submit(JobRequest<T> jobRequest) {
		
		jobRequest.scheduleAsJob(new JobIdImpl(jobRequest.getMetaIdentifiers()));

		map.put(jobRequest.getId(), jobRequest);

		System.out.println("Added " + jobRequest);
		LOG.trace("{} added to service", jobRequest);
		
		ForkJoinPool.commonPool().execute((Runnable) (() -> {
			try {
				jobRequest.run();
				jobRequest.get();
			} catch (InterruptedException e) {
				LOG.debug("Submitted job was interrupted.", e);
			} catch (ExecutionException e) {
				LOG.error("Error while executing job.", e);
			} finally {				
				announceCompletion(jobRequest);
				map.remove(jobRequest.getId());
			}
		}));

		return jobRequest;
	}
	
	private void announceCompletion(Job<?> adapter) {
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
				messageConverter.write(adapter, MediaType.APPLICATION_JSON, outputMessage);
				msg = outputMessage.toString();
			} else {
				msg = adapter.toString();
			}
			if (null == messagingTemplate)
				LOG.warn("messagingTemplate was null, so no completion announcement will be sent to user");
			else
				messagingTemplate.convertAndSendToUser(adapter.getCreator().getName(), "/topic/jobs", msg);
		} catch (HttpMessageNotWritableException | MessagingException | IOException e) {
			LOG.error("Error attempting to announce job completion. ", e);
		}
	}

}
