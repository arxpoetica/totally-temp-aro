package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import com.altvil.aro.util.json.GeometryJsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vividsolutions.jts.geom.Geometry;

@Entity
@Table(name = "network_plan_data", schema = "client")
public class NetworkPlanData {

	private NetworkPlanDataKey id;

	//private NetworkPlan networkPlan;

	private Geometry geometry;
	private String dataField;
	//private Blob blobData;

	@Id
	@Column(name = "id")
	public NetworkPlanDataKey getId() {
		return id;
	}

	public void setId(NetworkPlanDataKey networkPlanDataKey) {
		this.id = networkPlanDataKey;
	}

	/*@JoinColumn(name = "network_plan_id", referencedColumnName = "id", insertable = false, updatable = false)
	@ManyToOne(optional = false)
	public NetworkPlan getNetworkPlan() {
		return networkPlan;
	}

	public void setNetworkPlan(NetworkPlan parentPlan) {
		this.networkPlan = parentPlan;
	}
*/
	@Column(name = "geom")
	@JsonDeserialize(using = GeometryJsonDeserializer.class)
	public Geometry getGeometry() {
		return geometry;
	}

	public void setGeometry(Geometry geometry) {
		this.geometry = geometry;
	}

	@Column(name="data_field")
	public String getDataField() {
		return dataField;
	}

	public void setDataField(String dataField) {
		this.dataField = dataField;
	}
	
	

//	public Blob getBlobData() {
//		return blobData;
//	}
//
//	public void setBlobData(Blob blobData) {
//		this.blobData = blobData;
//	}

}
