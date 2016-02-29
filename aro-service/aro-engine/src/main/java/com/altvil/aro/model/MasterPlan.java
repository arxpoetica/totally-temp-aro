package com.altvil.aro.model;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;

@Entity
@DiscriminatorValue("1")
public class MasterPlan extends NetworkPlan {
	
	private Set<WirecenterPlan> wirecenterPlans = new HashSet<>() ;

	@OneToMany(fetch = FetchType.LAZY, mappedBy = "masterPlan", orphanRemoval = true, cascade = {CascadeType.ALL})
	public Set<WirecenterPlan> getWirecenterPlans() {
		return wirecenterPlans;
	}

	public void setWirecenterPlans(Set<WirecenterPlan> wirecenterPlans) {
		this.wirecenterPlans = wirecenterPlans;
	}

}
