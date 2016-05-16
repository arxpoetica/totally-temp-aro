package com.altvil.aro.service.network;

/**
 * A type-safe Plan Identifier to keep the APIs more manageable.
 * 
 * @author Kevin
 *
 */

@Deprecated
public class PlanId extends Number {
	private static final long serialVersionUID = 1L;
	private final long		  planId;

	public PlanId(long planId) {
		this.planId = planId;
	}

	@Override
	public int intValue() {
		return (int) planId;
	}

	@Override
	public long longValue() {
		return planId;
	}

	@Override
	public float floatValue() {
		return planId;
	}

	@Override
	public double doubleValue() {
		return planId;
	}
	
	public static PlanId of(Number n) {
		return new PlanId(n.longValue());
	}
}
