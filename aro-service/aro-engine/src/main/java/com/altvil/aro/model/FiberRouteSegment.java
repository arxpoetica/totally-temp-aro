package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.altvil.interfaces.CableConstructionEnum;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.Geometry;

@Entity
@Table(name = "fiber_route_segment", schema = "client")
public class FiberRouteSegment {

	private Long id;
	private FiberRoute fiberRoute;
	private CableConstructionEnum cableConstructionType ;
	private double lengthInMeters ;
	private Geometry geometry;

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy=GenerationType.IDENTITY)
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
	
	
	@Enumerated(value = EnumType.ORDINAL)
	@Column(name="cable_construction_type_id")
	public CableConstructionEnum getCableConstructionType() {
		return cableConstructionType;
	}

	public void setCableConstructionType(CableConstructionEnum cableConstructionType) {
		this.cableConstructionType = cableConstructionType;
	}

	@Column(name = "length_meters")
	public double getLengthInMeters() {
		return lengthInMeters;
	}

	public void setLengthInMeters(double lengthInMeters) {
		this.lengthInMeters = lengthInMeters;
	}

	public void setFiberRoute(FiberRoute fiberRoute) {
		this.fiberRoute = fiberRoute;
	}

	@Column(name = "geom")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public Geometry getGeometry() {
		return geometry;
	}

	public void setGeometry(Geometry geometry) {
		this.geometry = geometry;
	}

}
