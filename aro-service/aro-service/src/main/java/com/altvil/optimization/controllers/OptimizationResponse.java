package com.altvil.optimization.controllers;

import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class OptimizationResponse {
	/*
	private OptimizationSummaryDetails optimizationSummaryDetails ;
	
	@XmlElement
	private int id;
	@XmlElement
	private Map<Integer, Integer> progress = null;
	
	@XmlElement
	private Map<Integer, Long> runTimes = null;
	
	@XmlElement
	private String status = "running";
	@XmlElement
	private List<String> errors = new ArrayList<>();
	
	private OptimizationSummaryDetails summaryDetails ;
	
	public OptimizationResponse() {
	}

	public OptimizationResponse(AnalysisStatus status, int id) {
		this.id = id ;
		this.runTimes = status.getTimeMap();
		this.setProgress(status.getProgressPercentage());
		this.summaryDetails = status.getSummaryDetails()  ;
		
		if (status.isError()) {
			this.setException(status.getException());
		} else if (status.isCanceled()) {
			this.setCancelled();
		} else if (status.isAnalyzingAreasDone()) {
			this.setAnalysisDone();
		}
	}
	
	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public List<String> getErrors() {
		return errors;
	}

	public void setErrors(List<String> errors) {
		this.errors = errors;
	}

	public int getId() {
		return id;
	}

	public Map<Integer, Integer> getProgress() {
		return progress;
	}

	public void setProgress(Map<Integer, Integer> map) {
		this.progress = map;
	}

	
	public Map<Integer, Long> getRunTimes() {
		return runTimes;
	}

	public void setRunTimes(Map<Integer, Long> runTimes) {
		this.runTimes = runTimes;
	}

	public void setId(int id) {
		this.id = id;
	}

	public void setException(Throwable ex) {
		this.status = "error";
		try (StringWriter out = new StringWriter();
				PrintWriter pw = new PrintWriter(out)) {
			ex.printStackTrace(pw);
			this.errors.add(out.toString());
		} catch (IOException e) {
			throw new RuntimeException(e);
		}

	}
	
	

	public OptimizationSummaryDetails getOptimizationSummaryDetails() {
		return optimizationSummaryDetails;
	}

	public void setOptimizationSummaryDetails(
			OptimizationSummaryDetails optimizationSummaryDetails) {
		this.optimizationSummaryDetails = optimizationSummaryDetails;
	}

	public OptimizationSummaryDetails getSummaryDetails() {
		return summaryDetails;
	}

	public void setSummaryDetails(OptimizationSummaryDetails summaryDetails) {
		this.summaryDetails = summaryDetails;
	}

	public void setAnalysisDone() {
		this.status = "analysisDone";
	}

	public void setCancelled() {
		this.status = "cancelled";
	}
	*/

}
