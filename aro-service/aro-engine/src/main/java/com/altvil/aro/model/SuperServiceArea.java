package com.altvil.aro.model;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;

@Entity
@DiscriminatorValue("S")
public class SuperServiceArea extends ProcessArea {

}
