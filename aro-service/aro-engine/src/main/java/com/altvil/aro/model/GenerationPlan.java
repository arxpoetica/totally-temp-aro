package com.altvil.aro.model;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;


@Entity
@DiscriminatorValue("G")
public class GenerationPlan extends NetworkPlan {
		
}

