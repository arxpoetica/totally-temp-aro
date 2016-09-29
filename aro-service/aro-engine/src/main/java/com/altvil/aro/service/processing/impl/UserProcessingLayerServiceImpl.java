package com.altvil.aro.service.processing.impl;

import java.io.Reader;
import java.io.Writer;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.DataSourceEntityRepository;
import com.altvil.aro.persistence.repository.ServiceLayerRepository;
import com.altvil.aro.persistence.repository.user_data.DataSourceEntity;
import com.altvil.aro.persistence.repository.user_data.SourceLocationEntity;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import com.altvil.utils.csv.CsvReaderWriter;
import com.altvil.utils.csv.CsvReaderWriterFactory;
import com.opencsv.bean.CsvBind;

@Service
public class UserProcessingLayerServiceImpl implements
		UserProcessingLayerService {
	private ServiceLayerRepository serviceLayerRepository;
	private DataSourceEntityRepository dataSourceEntityRepository;

	private CsvReaderWriter<EntityDataRow> csvReaderWriter;

	@Autowired
	public UserProcessingLayerServiceImpl(
			ServiceLayerRepository serviceLayerRepository,
			DataSourceEntityRepository dataSourceEntityRepository) {
		super();
		this.serviceLayerRepository = serviceLayerRepository;
		this.dataSourceEntityRepository = dataSourceEntityRepository;
	}

	@PostConstruct
	void PostConstruct() {
		csvReaderWriter = CsvReaderWriterFactory.FACTORY
				.create(EntityDataRow.class);
	}

	@Override
	public Collection<ServiceLayer> getUserServiceLayers(int userId) {
		return serviceLayerRepository.getByUserId(userId);
	}

	@Override
	public ServiceLayer getUserServiceLayers(int userId, int id) {
		return serviceLayerRepository.getByUserIdAndId(userId, id);
	}

	@Override
	public ServiceLayer addUserServiceLayer(int userId, String layerName,
			String layerDescription) {
		ServiceLayer serviceLayer = new ServiceLayer();
		serviceLayer.setName(layerName);
		serviceLayer.setDescription(layerDescription);
		
		DataSourceEntity dse = new DataSourceEntity() ;
		
		dse.setName("ServiceLayerData");
		dse.setDescription("User Service Layer Data") ;
		dse.setUserId(userId) ;
		
		serviceLayer.setDataSource(dse) ;
		
		
		return serviceLayerRepository.save(serviceLayer);
	}

	@Override
	@Transactional
	public void loadUserServiceLayerEntitiesCSV(int id, Writer writer) {
		csvReaderWriter.write(writer, toEntityDataRows(serviceLayerRepository
				.getOne(id).getDataSource().getSourceLocationEntities()));
	}

	@Override
	@Transactional
	public void saveUserServiceLayerEntitiesCSV(int id, Reader reader) {

		DataSourceEntity ds = serviceLayerRepository.getOne(id).getDataSource();

		ds.setSourceLocationEntities(csvReaderWriter.parse(reader).stream()
				.map(r -> {
					SourceLocationEntity sl = new SourceLocationEntity();
					sl.setDataSource(ds);
					sl.setLat(r.getLat());
					sl.setLongitude(r.getLongitude());
					sl.setEntityCategoryId(r.getEntityCategoryId());
					return sl;
				}).collect(Collectors.toSet()));

		dataSourceEntityRepository.save(ds);

	}

	//
	//
	//

	private List<EntityDataRow> toEntityDataRows(
			Collection<SourceLocationEntity> sourceEntities) {
		return sourceEntities.stream().map(e -> {

			EntityDataRow dr = new EntityDataRow();

			dr.setEntityCategoryId(e.getEntityCategoryId());
			dr.setLat(e.getLat());
			dr.setLongitude(e.getLongitude());

			return dr;

		}).collect(Collectors.toList());
	}
	
	public static class EntityDataRow {
		@CsvBind
		private Integer entityCategoryId;
		@CsvBind
		private Double lat;
		@CsvBind
		private Double longitude;

		public Integer getEntityCategoryId() {
			return entityCategoryId;
		}

		public void setEntityCategoryId(Integer entityCategoryId) {
			this.entityCategoryId = entityCategoryId;
		}

		public Double getLat() {
			return lat;
		}

		public void setLat(Double lat) {
			this.lat = lat;
		}

		public Double getLongitude() {
			return longitude;
		}

		public void setLongitude(Double longitude) {
			this.longitude = longitude;
		}

	}

}
