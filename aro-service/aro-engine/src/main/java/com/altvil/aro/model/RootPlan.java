package com.altvil.aro.model;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;

@Entity
@DiscriminatorValue("R")
public class RootPlan extends NetworkPlan {
	
	private Set<MasterPlan> masterPlans = new HashSet<>() ;

	@OneToMany(fetch = FetchType.LAZY, mappedBy = "rootPlan", orphanRemoval = true, cascade = {CascadeType.ALL})
	public Set<MasterPlan> getMasterPlans() {
		return masterPlans;
	}

	public void setMasterPlans(Set<MasterPlan> masterPlans) {
		this.masterPlans = masterPlans;
	}

}
