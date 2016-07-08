package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "line_item", schema = "financial")
public class LineItem {

	private LineItemKey id;
	private Double doubleValue;

	@EmbeddedId
	public LineItemKey getId() {
		return id;
	}

	public void setId(LineItemKey id) {
		this.id = id;
	}

	@Column(name = "value")
	public Double getDoubleValue() {
		return doubleValue;
	}

	public void setDoubleValue(Double doubleValue) {
		this.doubleValue = doubleValue;
	}

}
