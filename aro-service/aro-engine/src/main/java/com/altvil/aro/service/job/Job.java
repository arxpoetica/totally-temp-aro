package com.altvil.aro.service.job;

import java.util.Date;
import java.util.concurrent.Future;

/**
 * A job is an asynchronous computation that has an unique identifier. The
 * JobService will, when provided an id, return a pending or active computation.
 * 
 * @author Kevin
 *
 * @param <T>
 */
public interface Job<T> extends Future<T> {
	interface Id {
	}

	Id getId();

	Date getScheduledTime();

	Date getCompletedTime();
}
