package com.altvil.aro.service.job;

import java.util.Date;
import java.util.concurrent.Future;

import com.altvil.aro.service.job.impl.JobIdDeserializer;
import com.altvil.aro.service.job.impl.JobIdSerializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

/**
 * A job is an asynchronous computation that has a light-weight identifier that can easily be passed between the front-end and the service layer.
 * 
 * @author Kevin
 *
 * @param <T>
 */
public interface Job<T> extends Future<T> {
	@JsonDeserialize(using = JobIdDeserializer.class)
	interface Id {
		long getUid();
		Object get(String key);
	}

	Id getId();

	Date getStartedTime();
	
	Date getScheduledTime();

	Date getCompletedTime();
}
