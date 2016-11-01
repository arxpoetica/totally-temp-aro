package com.altvil.aro.persistence.repository.user_data;

import javax.persistence.*;

import com.altvil.aro.persistence.HstoreUserType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.vividsolutions.jts.geom.Point;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "source_location_entity", schema = "user_data", catalog = "aro")
@TypeDef(name = "hstore", typeClass = HstoreUserType.class)
public class SourceLocationEntity {
    
	private Long id;
	private UserDataSource dataSource;

    private LocationClass locationClass;

	private Integer entityCategoryId;
	private Double lat;
    private Double longitude;

    private Point point;

    private Map<String,String> customAttributes = new HashMap<>();

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
            generator = "source_location_entity_id_seq")
    @SequenceGenerator(name = "source_location_entity_id_seq", schema = "user_data", sequenceName = "source_location_entity_id_seq", allocationSize = 1)
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
    public UserDataSource getDataSource() {
        return dataSource;
    }

    public void setDataSource(UserDataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Basic
    public Point getPoint() {
        return point;
    }

    public void setPoint(Point point) {
        this.point = point;
    }

    @Basic
    @Column(name = "custom_attributes")
    @Type(type = "hstore")
    public Map<String, String> getCustomAttributes() {
        return customAttributes;
    }

    public void setCustomAttributes(Map<String, String> customAttributes) {
        this.customAttributes = customAttributes;
    }


    @Column(name="location_class")
    @Enumerated(EnumType.ORDINAL)
    public LocationClass getLocationClass() {
        return locationClass;
    }

    public void setLocationClass(LocationClass locationClass) {
        this.locationClass = locationClass;
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
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (entityCategoryId != null ? entityCategoryId.hashCode() : 0);
        result = 31 * result + (lat != null ? lat.hashCode() : 0);
        result = 31 * result + (longitude != null ? longitude.hashCode() : 0);
        return result;
    }


}
