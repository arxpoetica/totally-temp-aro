package com.altvil.netop.demand.heatmap;

public class LocationSpendResponse {
    double x, y;
    long locationId;
    double spend;

    public LocationSpendResponse(double x, double y, long locationId, double spend) {
        this.x = x;
        this.y = y;
        this.locationId = locationId;
        this.spend = spend;
    }

    public double getSpend() {
        return spend;
    }

    public void setSpend(double spend) {
        this.spend = spend;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public long getLocationId() {
        return locationId;
    }

    public void setLocationId(long locationId) {
        this.locationId = locationId;
    }
}
