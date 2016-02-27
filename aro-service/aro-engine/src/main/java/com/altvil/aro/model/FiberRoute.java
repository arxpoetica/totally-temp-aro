package com.altvil.aro.model;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import com.altvil.aro.service.graph.segment.FiberType;


@Entity
@Table(name = "fiber_route", schema="client")
public class FiberRoute extends ComparableModel {
	
	private Long id ;
	private FiberType fiberRouteType ;
	private NetworkNode parentNode ;
	private NetworkNode fromNode ;
	private NetworkNode toNode ;
	private String name ;
	private Set<FiberSegment> fiberSegments = new HashSet<>() ;
	
	
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
	
	@Column(name="fiber_route_type")
	@Enumerated(EnumType.ORDINAL)
	public FiberType getFiberRouteType() {
		return fiberRouteType;
	}
	
	public void setFiberRouteType(FiberType fiberRouteType) {
		this.fiberRouteType = fiberRouteType;
	}
	
	@ManyToOne
	@JoinColumn(name = "parent_node_id", nullable = true)
	public NetworkNode getParentNode() {
		return parentNode;
	}
	public void setParentNode(NetworkNode parentNode) {
		this.parentNode = parentNode;
	}
	
	@ManyToOne
	@JoinColumn(name = "from_node_id", nullable = true)
	public NetworkNode getFromNode() {
		return fromNode;
	}
	public void setFromNode(NetworkNode fromNode) {
		this.fromNode = fromNode;
	}
	
	@ManyToOne
	@JoinColumn(name = "to_node_id", nullable = true)
	public NetworkNode getToNode() {
		return toNode;
	}
	public void setToNode(NetworkNode toNode) {
		this.toNode = toNode;
	}

	@Column(name = "name")
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "fiberRoute", orphanRemoval = true, cascade = {CascadeType.ALL})
	public Set<FiberSegment> getFiberSegments() {
		return fiberSegments;
	}

	public void setFiberSegments(Set<FiberSegment> fiberSegments) {
		this.fiberSegments = fiberSegments;
	}
	
	
	
	
	
}
