package com.altvil.netop.locations.model;

import java.util.List;
import java.util.Map;

public class BusinessDataByDistance {

   double distance;
    String key;
    double value;

    public BusinessDataByDistance(double distance, String key, double value) {
        this.distance = distance;
        this.key = key;
        this.value = value;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }
}
