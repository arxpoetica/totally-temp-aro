package com.altvil.aro.persistence.repository.model;

public class BusinessReportElement {
    double distance;
    String key;
    Double value;


    public BusinessReportElement(double distance, String key, Double value) {
        this.distance = distance;
        this.key = key;
        this.value = value;
    }

    public double getDistance() {
        return distance;
    }

    public String getKey() {
        return key;
    }

    public Double getValue() {
        return value;
    }
}
