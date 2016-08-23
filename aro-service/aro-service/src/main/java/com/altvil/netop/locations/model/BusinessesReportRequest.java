package com.altvil.netop.locations.model;

public class BusinessesReportRequest {
    long planId;
    double mrcThreshold;
    String locationSource;
    double distanceThresholds[];

    public long getPlanId() {
        return planId;
    }

    public void setPlanId(long planId) {
        this.planId = planId;
    }

    public double getMrcThreshold() {
        return mrcThreshold;
    }

    public void setMrcThreshold(double mrcThreshold) {
        this.mrcThreshold = mrcThreshold;
    }

    public String getLocationSource() {
        return locationSource;
    }

    public void setLocationSource(String locationSource) {
        this.locationSource = locationSource;
    }

    public double[] getDistanceThresholds() {
        return distanceThresholds;
    }

    public void setDistanceThresholds(double[] distanceThresholds) {
        this.distanceThresholds = distanceThresholds;
    }
}
