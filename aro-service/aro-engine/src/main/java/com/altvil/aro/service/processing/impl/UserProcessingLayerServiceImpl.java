package com.altvil.aro.service.processing.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import com.altvil.aro.model.ProcessArea;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.ServiceArea;
import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.DataSourceEntityRepository;
import com.altvil.aro.persistence.repository.ServiceAreaRepository;
import com.altvil.aro.persistence.repository.ServiceLayerRepository;
import com.altvil.aro.persistence.repository.user_data.DataSourceEntity;
import com.altvil.aro.persistence.repository.user_data.SourceLocationEntity;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.csv.CsvReaderWriter;
import com.altvil.utils.csv.CsvReaderWriterFactory;
import com.opencsv.bean.CsvBind;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;

@Service
public class UserProcessingLayerServiceImpl implements
		UserProcessingLayerService {
	private ServiceLayerRepository serviceLayerRepository;
	private DataSourceEntityRepository dataSourceEntityRepository;
	private ServiceAreaRepository serviceAreaRepository;

	private CsvReaderWriter<EntityDataRow> csvReaderWriter;

	@Autowired
	public UserProcessingLayerServiceImpl(
			ServiceLayerRepository serviceLayerRepository,
			DataSourceEntityRepository dataSourceEntityRepository,
			ServiceAreaRepository serviceAreaRepository) {
		super();
		this.serviceLayerRepository = serviceLayerRepository;
		this.dataSourceEntityRepository = dataSourceEntityRepository;
		this.serviceAreaRepository = serviceAreaRepository;
	}

	@PostConstruct
	void PostConstruct() {
		csvReaderWriter = CsvReaderWriterFactory.FACTORY.create(
				EntityDataRow.class, "entityCategoryId", "lat", "longitude");
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
	@Transactional
	public ServiceLayer addUserServiceLayer(int userId, String layerName,
			String layerDescription) {
		ServiceLayer serviceLayer = new ServiceLayer();
		serviceLayer.setName(layerName);
		serviceLayer.setDescription(layerDescription);
		serviceLayer.setUserDefined(true);

		DataSourceEntity dse = new DataSourceEntity();

		dse.setName(layerName);
		dse.setDescription(layerDescription);
		dse.setUserId(userId);

		this.dataSourceEntityRepository.save(dse);
		serviceLayer.setDataSource(dse);

		return serviceLayerRepository.save(serviceLayer);
	}

	@Override
	public void saveUserServiceLayerEntitiesCSV(int id, Reader reader)
			throws IOException {
		saveUserServiceLayerEntitiesCSV(id, new BufferedReader(reader));

	}

	@Override
	@Transactional
	public void loadUserServiceLayerEntitiesCSV(int id, Writer writer) {
		csvReaderWriter.write(writer, toEntityDataRows(serviceLayerRepository
				.getOne(id).getDataSource().getSourceLocationEntities()));
	}

	@Override
	@Transactional
	public void saveUserServiceLayerEntitiesCSV(int id, BufferedReader reader)
			throws IOException {

		DataSourceEntity ds = serviceLayerRepository.getOne(id).getDataSource();
		ds.getSourceLocationEntities().clear();

		ds.getSourceLocationEntities()
				.addAll(csvReaderWriter
						.parse(reader)
						.stream()
						.map(r -> {
							SourceLocationEntity sl = new SourceLocationEntity();
							sl.setDataSource(ds);
							sl.setLat(r.getLat());
							sl.setLongitude(r.getLongitude());
							sl.setPoint(GeometryUtil.asPoint(new Coordinate(r
									.getLongitude(), r.getLat())));
							sl.setEntityCategoryId(r.getEntityCategoryId());
							return sl;
						}).collect(Collectors.toSet()));

		dataSourceEntityRepository.save(ds);

	}

	@Transactional
	private Set<Point> getPoints(int serviceLayerId) {

		return serviceLayerRepository
				.querySourceLocationEntityForServiceLayer(serviceLayerId)
				.stream().map(SourceLocationEntity::getPoint)
				.collect(Collectors.toSet());

	}

	private Collection<ServiceArea> saveAsServiceAreas(int serviceLayerId,
			Collection<Polygon> polygons) {

		ServiceLayer serviceLayer = serviceLayerRepository.getOne(serviceLayerId);
		Set<ProcessArea> processAreas = serviceLayer.getProcessAreas();

		processAreas.clear();
		processAreas.addAll(polygons.stream()
				.map(polygon -> createServiceArea(polygon, serviceLayer))
				.collect(Collectors.toSet()));


		Collection<ServiceArea> updatedServiceAreas = castToServiceAreas(serviceLayerRepository.save(serviceLayer).getProcessAreas());

		
		//Update the Service Area Buffers
		serviceAreaRepository.updateServiceAreaBuffers(serviceLayerId);
		
		//Update the Equipment into Head Plan
		serviceLayerRepository.updateServiceLayerEquipment(serviceLayerId) ;
		
		return updatedServiceAreas ;

	}

	private Set<ServiceArea> castToServiceAreas(Set<ProcessArea> processAreas) {
		return processAreas.stream().map(processArea -> (ServiceArea) processArea).collect(Collectors.toSet());
	}

	@Override
	@Transactional
	public int createAreasFromPoints(int serviceLayerId,
			double maxDistanceMeters) {

		VoronoiPolygonsGenerator polygonsGenerator = new VoronoiPolygonsGenerator(
				maxDistanceMeters);

		Collection<Polygon> polygons = polygonsGenerator
				.generatePolygons(getPoints(serviceLayerId));

		return saveAsServiceAreas(serviceLayerId, polygons).size();

	}

	private ServiceArea createServiceArea(Polygon polygon,
			ServiceLayer serviceLayer) {
		Polygon polygons[] = { polygon };
		MultiPolygon multiPolygon = GeometryUtil.factory().createMultiPolygon(
				polygons);
		ServiceArea sa = new ServiceArea();
		sa.setGeog(multiPolygon);
		sa.setGeom(multiPolygon);
		sa.setSourceId("autogen");
		sa.setCode("autogen_" + System.currentTimeMillis() + '_'
				+ Math.random());
		sa.setLayer(serviceLayer);
		return sa;
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
		private int entityCategoryId;
		@CsvBind
		private double lat;
		@CsvBind
		private double longitude;

		public int getEntityCategoryId() {
			return entityCategoryId;
		}

		public void setEntityCategoryId(int entityCategoryId) {
			this.entityCategoryId = entityCategoryId;
		}

		public double getLat() {
			return lat;
		}

		public void setLat(double lat) {
			this.lat = lat;
		}

		public double getLongitude() {
			return longitude;
		}

		public void setLongitude(double longitude) {
			this.longitude = longitude;
		}

	}

}
