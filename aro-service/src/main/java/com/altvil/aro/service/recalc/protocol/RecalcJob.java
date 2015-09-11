package com.altvil.aro.service.recalc.protocol;

import java.util.Date;

import com.altvil.aro.service.plan.RecalcRequest;

public class RecalcJob {

	private long jobId;

	private RecalcRequest request;
	private Date scheduledTime;

	public long getJobId() {
		return jobId;
	}

	public void setJobId(long jobId) {
		this.jobId = jobId;
	}

	public RecalcRequest getRequest() {
		return request;
	}

	public void setRequest(RecalcRequest request) {
		this.request = request;
	}

	public Date getScheduledTime() {
		return scheduledTime;
	}

	public void setScheduledTime(Date scheduledTime) {
		this.scheduledTime = scheduledTime;
	}

}
