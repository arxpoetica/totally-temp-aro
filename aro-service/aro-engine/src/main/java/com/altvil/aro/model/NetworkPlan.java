package com.altvil.aro.model;

import java.io.Serializable;
import java.util.Date;

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
import javax.persistence.Transient;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.Point;

@Entity
@Table(name = "plan", schema="client")
public class NetworkPlan extends ComparableModel {
	
	private Long id ;
	private String name ;
	private PlanType planType = PlanType.UNDEFINED;
	private WireCenter wireCenter ;
	private String areaName ;
	private Point areaBounds ;
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
	
	@Column(name="plan_type")
	@Enumerated(EnumType.ORDINAL)
	public PlanType getPlanType() {
		return planType;
	}
	public void setPlanType(PlanType planType) {
		this.planType = planType;
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
	
	
	@Column(name = "area_centroid")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public Point getAreaBounds() {
		return areaBounds;
	}
	
	public void setAreaBounds(Point areaBounds) {
		this.areaBounds = areaBounds;
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
