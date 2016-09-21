package com.altvil.aro.service.cu.execute;

import java.io.Serializable;

public class JobProcessedEvent<R extends Serializable> {

	private int currentCount;
	private R job;

	public JobProcessedEvent(R job, int currentCount) {
		super();
		this.job = job;
		this.currentCount = currentCount;
	}

	public int getCurrentCount() {
		return currentCount;
	}

	public R getJob() {
		return job;
	}
}
