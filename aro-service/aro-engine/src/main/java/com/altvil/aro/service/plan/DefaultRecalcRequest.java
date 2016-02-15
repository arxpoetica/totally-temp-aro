package com.altvil.aro.service.plan;


public class DefaultRecalcRequest implements RecalcRequest {

	private int planId;
	private Integer fdtCount ;
	private Integer fdhCount ;

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.plan.RecalcRequest#getPlanId()
	 */
	@Override
	public int getPlanId() {
		return planId;
	}

	public void setPlanId(int planId) {
		this.planId = planId;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.plan.RecalcRequest#getFdtCount()
	 */
	@Override
	public Integer getFdtCount() {
		return fdtCount;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.plan.RecalcRequest#getFdhCount()
	 */
	@Override
	public Integer getFdhCount() {
		return fdhCount;
	}

	public void setFdtCount(Integer fdtCount) {
		this.fdtCount = fdtCount;
	}

	public void setFdhCount(Integer fdhCount) {
		this.fdhCount = fdhCount;
	}
	
	
	

}
