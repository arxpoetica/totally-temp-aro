package com.altvil.utils.reference;

public class VolatileReferenceInfo {


    private long lastTouchedInMillis;
    private boolean valuePresent;

    public VolatileReferenceInfo(long lastTouchedInMillis, boolean valuePresent) {
        super();
        this.lastTouchedInMillis = lastTouchedInMillis;
        this.valuePresent = valuePresent;
    }

    public long getLastTouchedInMillis() {
        return lastTouchedInMillis;
    }

    public boolean isValuePresent() {
        return valuePresent;
    }

	
}
