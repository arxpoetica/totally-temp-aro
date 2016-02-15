package com.altvil.aro.service.recalc.protocol;

import java.util.Date;

public class RecalcResponse<T> {

	private RecalcJob job;

	public T result;
	private Long runningTime;
	private Date completedTime;
	private boolean success;
	private String message = "";

	public RecalcJob getJob() {
		return job;
	}

	public void setJob(RecalcJob job) {
		this.job = job;
	}

	public long getRunningTimeInMillis() {
		return runningTime;
	}

	public void setRunningTimeInMillis(Long runningTime) {
		this.runningTime = runningTime;
	}

	public Date getCompletedTime() {
		return completedTime;
	}

	public void setCompletedTime(Date completedTime) {
		this.completedTime = completedTime;
	}

	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public T getResult() {
		return result;
	}

	public void setResult(T result) {
		this.result = result;
	}

}
