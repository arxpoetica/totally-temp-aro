package com.altvil.aro.service.job;

import java.util.Date;
import java.util.concurrent.Future;

/**
 * A job is an asynchronous computation that has a light-weight identifier that can easily be passed between the front-end and the service layer.
 * 
 * @author Kevin
 *
 * @param <T>
 */
public interface Job<T> extends Future<T> {
	interface Id {
		long getUid();
		Object get(String key);
	}

	Id getId();

	Date getStartedTime();
	
	Date getScheduledTime();

	Date getCompletedTime();
}
