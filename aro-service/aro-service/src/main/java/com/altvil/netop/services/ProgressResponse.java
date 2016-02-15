package com.altvil.netop.services;

/**
 * Created by kwysocki on 05.11.15.
 */
public class ProgressResponse {
    Integer id;
    int progressPercentage;
    String status;
    Exception exception;

    public ProgressResponse(Integer coverageInputsId, int progressPercentage, String status, Exception exception) {
        this.id = coverageInputsId;
        this.progressPercentage = progressPercentage;
        this.status = status;
        this.exception = exception;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public int getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(int progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Exception getException() {
        return exception;
    }

    public void setException(Exception exception) {
        this.exception = exception;
    }
}
