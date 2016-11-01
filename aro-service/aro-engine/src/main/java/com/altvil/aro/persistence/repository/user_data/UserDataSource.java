package com.altvil.aro.persistence.repository.user_data;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonManagedReference;


@Entity
@Table(name = "data_source", schema = "user_data", catalog = "aro")
public class UserDataSource {
    private Long id;
    private String name;
    private String description;
    private Integer userId ;
    private Set<SourceLocationEntity> sourceLocationEntities = new HashSet<>();
    private int referenceDataSourceId;

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
            generator = "data_source_id_seq")
    @SequenceGenerator(name = "data_source_id_seq", schema = "user_data", sequenceName = "data_source_id_seq", allocationSize = 1)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Basic
    @Column(name = "name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Basic
    @Column(name = "description")
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        UserDataSource that = (UserDataSource) o;

        if (id != that.id) return false;
        if (name != null ? !name.equals(that.name) : that.name != null) return false;
        if (description != null ? !description.equals(that.description) : that.description != null) return false;

        return true;
    }


    @OneToMany(fetch = FetchType.LAZY, cascade = {CascadeType.ALL}, orphanRemoval = true, mappedBy = "dataSource")
    @JsonManagedReference
    public Set<SourceLocationEntity> getSourceLocationEntities() {
        return sourceLocationEntities;
    }

    public void setSourceLocationEntities(Set<SourceLocationEntity> sourceLocationEntities) {
        this.sourceLocationEntities = sourceLocationEntities;
    }

    @Column(name="user_id")
    public Integer getUserId() {
		return userId;
	}

	public void setUserId(Integer userId) {
		this.userId = userId;
	}

    @Column(name="reference_data_source_id")
    public int getReferenceDataSourceId() {
        return referenceDataSourceId;
    }

    public void setReferenceDataSourceId(int referenceDataSourceId) {
        this.referenceDataSourceId = referenceDataSourceId;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (description != null ? description.hashCode() : 0);
        result = 31 * result + (userId != null ? userId.hashCode() : 0);
        result = 31 * result + (sourceLocationEntities != null ? sourceLocationEntities.hashCode() : 0);
        return result;
    }
}
