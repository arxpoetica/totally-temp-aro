package com.altvil.aro.model;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;

@Entity
@DiscriminatorValue("R")
public class RootPlan extends NetworkPlan {
}
