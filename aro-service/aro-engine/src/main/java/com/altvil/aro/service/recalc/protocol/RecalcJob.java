package com.altvil.aro.service.recalc.protocol;

import java.util.Date;

public class RecalcJob {

	private long jobId;
	private Date scheduledTime;

	public long getJobId() {
		return jobId;
	}

	public void setJobId(long jobId) {
		this.jobId = jobId;
	}
	
	public Date getScheduledTime() {
		return scheduledTime;
	}

	public void setScheduledTime(Date scheduledTime) {
		this.scheduledTime = scheduledTime;
	}

}
