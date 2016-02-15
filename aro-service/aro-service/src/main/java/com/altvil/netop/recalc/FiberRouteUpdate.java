package com.altvil.netop.recalc;

public class FiberRouteUpdate {

	private long fiberRouteId;
	private long objectId;

	public FiberRouteUpdate() {
	}

	public FiberRouteUpdate(long fiberRouteId, long objectId) {
		super();
		this.fiberRouteId = fiberRouteId;
		this.objectId = objectId;
	}

	public long getFiberRouteId() {
		return fiberRouteId;
	}

	public void setFiberRouteId(long fiberRouteId) {
		this.fiberRouteId = fiberRouteId;
	}

	public long getObjectId() {
		return objectId;
	}

	public void setObjectId(long objectId) {
		this.objectId = objectId;
	}

}
