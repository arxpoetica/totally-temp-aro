package com.altvil.aro.model;

import java.io.Serializable;
import java.util.Date;

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
import com.vividsolutions.jts.geom.Point;

@Entity
@Inheritance
@DiscriminatorColumn(name="plan_type")
@DiscriminatorOptions(force=true)
@Table(name = "plan", schema="client")
public class NetworkPlan extends ComparableModel {
	
	private Long id ;
	private String name ;
	private WireCenter wireCenter ;
	private String areaName ;
	private Point areaCentroid ;
	private MultiPolygon areaBounds ;
	private Date createAt;
	private Date updateAt ;
	
	@Transient
	@Override
	protected Serializable getIdKey() {
		return id ;
	}
	
	@Id
	@Column(name = "id")
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	
	@Column(name="name")
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	
	
	@ManyToOne
	@JoinColumn(name = "wirecenter_id")
	public WireCenter getWireCenter() {
		return wireCenter;
	}
	public void setWireCenter(WireCenter wireCenter) {
		this.wireCenter = wireCenter;
	}
	
	@Column(name="area_name")
	public String getAreaName() {
		return areaName;
	}
	
	public void setAreaName(String areaName) {
		this.areaName = areaName;
	}
	
	
	@Column(name = "area_bounds")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public MultiPolygon getAreaBounds() {
		return areaBounds;
	}
	
	public void setAreaBounds(MultiPolygon areaBounds) {
		this.areaBounds = areaBounds;
	}
	

	@Column(name = "area_centroid")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public Point getCentroid() {
		return areaCentroid;
	}
	
	public void setCentroid(Point areaCentroid) {
		this.areaCentroid = areaCentroid;
	}
	
	@Column(name="created_at")
	public Date getCreateAt() {
		return createAt;
	}
	public void setCreateAt(Date createAt) {
		this.createAt = createAt;
	}
	
	@Column(name="updated_at")
	public Date getUpdateAt() {
		return updateAt;
	}
	public void setUpdateAt(Date updateAt) {
		this.updateAt = updateAt;
	}
	

}
