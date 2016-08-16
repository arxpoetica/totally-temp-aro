package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.DiscriminatorColumn;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

import org.hibernate.annotations.DiscriminatorOptions;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.MultiPolygon;

@Entity
@Inheritance
@DiscriminatorColumn(name = "service_type")
@DiscriminatorOptions(force = true)
@Table(name = "wirecenters", schema = "client")
public class WireCenter extends ComparableModel {

	private Integer id;
	
	private ServiceLayer layer;
	private String sourceId;
	private String code;

	private String state;
	
	private MultiPolygon geog;
	private MultiPolygon geom;

	@Transient
	@Override
	protected Serializable idKey() {
		return id;
	}

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}


	@Column(name="source_id")
	public String getSourceId() {
		return sourceId;
	}

	public void setSourceId(String sourceId) {
		this.sourceId = sourceId;
	}
	
	@ManyToOne
	@JoinColumn(name = "layer_id", nullable = false)
	public ServiceLayer getLayer() {
		return layer;
	}

	public void setLayer(ServiceLayer layer) {
		this.layer = layer;
	}

	@Column(name = "code")
	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	@Column(name = "state")
	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	@Column(name = "geog")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public MultiPolygon getGeog() {
		return geog;
	}

	public void setGeog(MultiPolygon geog) {
		this.geog = geog;
	}

	@Column(name = "geom")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public MultiPolygon getGeom() {
		return geom;
	}

	public void setGeom(MultiPolygon geom) {
		this.geom = geom;
	}

}
