package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.*;

import com.altvil.aro.persistence.repository.user_data.DataSourceEntity;

@SuppressWarnings("serial")
@Entity
@Table(name = "service_layer", schema = "client")
public class ServiceLayer extends ComparableModel implements Serializable  {

	private Integer id;
	//private Integer userId;
	private String name;
	private String description;
	private boolean userDefined;

	private DataSourceEntity dataSource;
	
	@Override
	protected Serializable idKey() {
		return id;
	}

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.SEQUENCE,
			generator = "service_layer_id_seq")
	@SequenceGenerator(name = "service_layer_id_seq", schema = "client", sequenceName = "service_layer_id_seq", allocationSize = 1)
	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	@Column(name = "name")
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDescription() {
		return description;
	}

	@Column(name = "description")
	public void setDescription(String description) {
		this.description = description;
	}

	@Column(name = "is_user_defined")
	public boolean isUserDefined() {
		return userDefined;
	}

	public void setUserDefined(boolean userDefined) {
		this.userDefined = userDefined;
	}

//	@Column(name = "user_id")
//	public Integer getUserId() {
//		return userId;
//	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "data_source_id")
	public DataSourceEntity getDataSource() {
		return dataSource;
	}

	public void setDataSource(DataSourceEntity dataSource) {
		this.dataSource = dataSource;
	}

//	public void setUserId(Integer userId) {
//		this.userId = userId;
//	}
}
