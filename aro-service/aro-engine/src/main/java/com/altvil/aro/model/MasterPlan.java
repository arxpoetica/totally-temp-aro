package com.altvil.aro.model;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;

@Entity
@DiscriminatorValue("M")
public class MasterPlan extends NetworkPlan {
	

}
