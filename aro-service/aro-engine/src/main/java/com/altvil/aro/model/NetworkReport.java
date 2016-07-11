package com.altvil.aro.model;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.DiscriminatorColumn;
import javax.persistence.DiscriminatorType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

import org.hibernate.annotations.DiscriminatorOptions;



@Entity
@Inheritance
@DiscriminatorColumn(name="code",  discriminatorType=DiscriminatorType.STRING)
@DiscriminatorOptions(force=true)
@Table(name = "network_report", schema = "financial")
public abstract class NetworkReport {

	private long id;
	private long planId;

	private String state = "*";
	private Date date;

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

//	@Column(name = "report_type_id")
//	@Enumerated(EnumType.ORDINAL)
	

	@Column(name = "plan_id")
	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}

	@Column(name = "state_code")
	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	@Column(name = "pricing_date")
	@Temporal(TemporalType.DATE)
	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}

}

/*
 * 
 * 
 * id bigserial primary key,
 * 
 * report_type_id int4 not null references financial.report_type, plan_id int8
 * not null references client.plan on delete cascade,
 * 
 * state_code varchar(16), pricing_date date
 */