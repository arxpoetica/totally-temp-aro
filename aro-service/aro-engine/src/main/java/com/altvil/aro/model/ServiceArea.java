package com.altvil.aro.model;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;

@Entity
@DiscriminatorValue("A")
public class ServiceArea extends ProcessArea {
}
