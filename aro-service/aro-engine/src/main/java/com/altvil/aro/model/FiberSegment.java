package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.Geometry;

@Entity
@Table(name = "fiber_segment")
public class FiberSegment {

	private Long id;
	private FiberRoute fiberRoute;
	private Geometry geometry;

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@ManyToOne
	@JoinColumn(name = "fiber_route_id", nullable = false)
	public FiberRoute getFiberRoute() {
		return fiberRoute;
	}

	public void setFiberRoute(FiberRoute fiberRoute) {
		this.fiberRoute = fiberRoute;
	}

	@javax.persistence.Column(name = "the_geom")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public Geometry getGeometry() {
		return geometry;
	}

	public void setGeometry(Geometry geometry) {
		this.geometry = geometry;
	}

}
