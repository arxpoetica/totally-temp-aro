package com.altvil.netop.jobs;

import com.altvil.aro.service.job.Job;
public class JobsRequest {
	private Job.Id id;

	Job.Id getId() {
		return id;
	}

	void setId(Job.Id id) {
		this.id = id;
	}
}
