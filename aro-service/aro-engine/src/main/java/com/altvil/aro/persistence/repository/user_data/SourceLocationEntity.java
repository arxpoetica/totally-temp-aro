package com.altvil.aro.persistence.repository.user_data;

import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "source_location_entity", schema = "user_data", catalog = "aro")
public class SourceLocationEntity {
    
	private Long id;
	private DataSourceEntity dataSource;
	
	private Integer entityCategoryId;
	private Double lat;
    private Double longitude;

    @Id
    @Column(name = "id")
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Basic
    @Column(name = "entity_category_id")
    public Integer getEntityCategoryId() {
        return entityCategoryId;
    }

    public void setEntityCategoryId(Integer entityCategoryId) {
        this.entityCategoryId = entityCategoryId;
    }

    @Basic
    @Column(name = "lat")
    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    @Basic
    @Column(name = "long")
    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "data_source_id", nullable = false)
    @JsonBackReference
    public DataSourceEntity getDataSource() {
        return dataSource;
    }

    public void setDataSource(DataSourceEntity dataSource) {
        this.dataSource = dataSource;
    }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        SourceLocationEntity that = (SourceLocationEntity) o;

        if (id != that.id) return false;
        if (entityCategoryId != null ? !entityCategoryId.equals(that.entityCategoryId) : that.entityCategoryId != null)
            return false;
        if (lat != null ? !lat.equals(that.lat) : that.lat != null) return false;
        if (longitude != null ? !longitude.equals(that.longitude) : that.longitude != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = (int) (id ^ (id >>> 32));
        result = 31 * result + (entityCategoryId != null ? entityCategoryId.hashCode() : 0);
        result = 31 * result + (lat != null ? lat.hashCode() : 0);
        result = 31 * result + (longitude != null ? longitude.hashCode() : 0);
        return result;
    }



}
