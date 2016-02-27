package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.MultiPolygon;

@Entity
@Table(name = "wirecenters", schema = "aro")
public class WireCenter extends ComparableModel {

	private Integer id;
	private long gid;
	private String state;
	private String wireCenter;
	private String aocn;
	private String aocnName;
	private MultiPolygon geog;
	private MultiPolygon geom;

	@Override
	protected Serializable getIdKey() {
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

	@Column(name = "gid")
	public long getGid() {
		return gid;
	}

	public void setGid(long gid) {
		this.gid = gid;
	}

	@Column(name = "state")
	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	@Column(name = "wirecenter")
	public String getWireCenter() {
		return wireCenter;
	}

	public void setWireCenter(String wireCenter) {
		this.wireCenter = wireCenter;
	}

	@Column(name = "aocn")
	public String getAocn() {
		return aocn;
	}

	public void setAocn(String aocn) {
		this.aocn = aocn;
	}

	@Column(name = "aocn_name")
	public String getAocnName() {
		return aocnName;
	}

	public void setAocnName(String aocnName) {
		this.aocnName = aocnName;
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
