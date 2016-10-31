package com.altvil.aro.model;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;


@Entity
@DiscriminatorValue("G")
public class GenerationPlan extends NetworkPlan {
	
	private ProcessArea wireCenter ;
	
	@ManyToOne
	@JoinColumn(name = "wirecenter_id", nullable=false)
	public ProcessArea getWireCenter() {
		return wireCenter;
	}

	public void setWireCenter(ProcessArea wireCenter) {
		this.wireCenter = wireCenter;
	}
	
	
}

