package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.*;

import org.hibernate.annotations.DiscriminatorOptions;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.MultiPolygon;

@Entity
@Inheritance
@DiscriminatorColumn(name = "service_type")
@DiscriminatorOptions(force = true)
@Table(name = "service_area", schema = "client")
public class ProcessArea extends ComparableModel {

	private Integer id;
	
	private ServiceLayer layer;
	private String sourceId;
	private String code;

	private MultiPolygon geog;
	private MultiPolygon geom;

	@Transient
	@Override
	protected Serializable idKey() {
		return id;
	}

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.SEQUENCE,
			generator = "service_area_id_seq")
	@SequenceGenerator(name = "service_area_id_seq", schema = "client", sequenceName = "service_area_id_seq", allocationSize = 1)
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
	@JoinColumn(name = "service_layer_id", nullable = false)
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
