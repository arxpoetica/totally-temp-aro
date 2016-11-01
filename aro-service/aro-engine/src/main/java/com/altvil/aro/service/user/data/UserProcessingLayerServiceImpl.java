package com.altvil.aro.service.user.data;

import com.altvil.aro.model.ProcessArea;
import com.altvil.aro.model.ServiceArea;
import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.DataSourceEntityRepository;
import com.altvil.aro.persistence.repository.ServiceAreaRepository;
import com.altvil.aro.persistence.repository.ServiceLayerRepository;
import com.altvil.aro.persistence.repository.user_data.LocationClass;
import com.altvil.aro.persistence.repository.user_data.SourceLocationEntity;
import com.altvil.aro.persistence.repository.user_data.UserDataSource;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import com.altvil.aro.service.processing.impl.VoronoiPolygonsGenerator;
import com.altvil.utils.GeometryUtil;
import com.opencsv.CSVReader;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.util.*;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class UserProcessingLayerServiceImpl implements
		UserProcessingLayerService {
	private ServiceLayerRepository serviceLayerRepository;
	private DataSourceEntityRepository dataSourceEntityRepository;
	private ServiceAreaRepository serviceAreaRepository;

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

		UserDataSource dse = new UserDataSource();

		dse.setName(layerName);
		dse.setDescription(layerDescription);
		dse.setUserId(userId);

		this.dataSourceEntityRepository.save(dse);
		serviceLayer.setDataSource(dse);

		return serviceLayerRepository.save(serviceLayer);
	}

	@Override
	public void saveUserServiceLayerEntitiesCSV(int id, Reader reader, LocationClass locationClass)
			throws IOException {
		saveUserServiceLayerEntitiesCSV(id, new BufferedReader(reader), locationClass);

	}



	@Override
	@Transactional
	public void loadUserServiceLayerEntitiesCSV(int id, Writer writer) {
		throw new UnsupportedOperationException();
		//csvReaderWriter.write(writer, toEntityDataRows(serviceLayerRepository
		//		.getOne(id).getDataSource().getSourceLocationEntities()));
	}

	@Override
	@Transactional
	public void saveUserServiceLayerEntitiesCSV(int id, BufferedReader reader, LocationClass locationClass)
			throws IOException {

		UserDataSource ds = serviceLayerRepository.getOne(id).getDataSource();
		//ds.getSourceLocationEntities().clear();
		CSVReader csvReader = new CSVReader(reader);

		ds.getSourceLocationEntities()
				.addAll(new SourceLocationsCSVReader().readSourceLocations(csvReader, ds, locationClass));

		dataSourceEntityRepository.save(ds);

	}

	@Override
	public void postProcessServiceLayerData(int serviceLayerId, LocationClass locationClass) {
		if(locationClass == LocationClass.consumer){
			this.updateCellTowers(serviceLayerId);
		}

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

		ServiceLayer savedServiceLayer = serviceLayerRepository.saveAndFlush(serviceLayer);

		return castToServiceAreas(savedServiceLayer.getProcessAreas());

	}
	
	@Transactional
	@Modifying
	public void updateServiceArea(int serviceLayerId) {
		//Update the Service Area Buffers
		serviceAreaRepository.updateServiceAreaBuffers(serviceLayerId);
		
		//Update the Equipment into Head Plan
		serviceLayerRepository.updateServiceLayerEquipment(serviceLayerId) ;
			
	}

	private Set<ServiceArea> castToServiceAreas(Set<ProcessArea> processAreas) {
		return processAreas.stream().map(processArea -> (ServiceArea) processArea).collect(Collectors.toSet());
	}

	@Override
	@Transactional
	public void updateCellTowers(int serviceLayerId) {
		serviceLayerRepository.updateServiceLayerTowers1(serviceLayerId);
		serviceLayerRepository.updateServiceLayerTowers2();
		serviceLayerRepository.updateServiceLayerTowers3();
	}

	@Override
	@Transactional
	@Modifying
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


	private class SourceLocationsCSVReader{

		Collection<SourceLocationEntity> readSourceLocations(CSVReader reader, UserDataSource dataSource, LocationClass locationClass)  {
			try {
				Collection<SourceLocationEntity> result = new ArrayList<>();
				Function<String[], SourceLocationEntity> rowMapper = createColumnDefinitions().bindHeader(reader.readNext(), createSupplier(dataSource, locationClass));
				rowMapper = postProcessEntity(rowMapper);
				String[] line;

				while(null != (line = reader.readNext())) {
                	result.add(rowMapper.apply(line));
                }

				return result;
			} catch (IOException e) {
				throw new RuntimeException(e);
			}

		}

		private Function<String[], SourceLocationEntity> postProcessEntity(Function<String[], SourceLocationEntity> rowMapper) {
			return (t) -> {
				SourceLocationEntity entity = rowMapper.apply(t);
				entity.setPoint(GeometryUtil.asPoint(new Coordinate(entity.getLongitude(), entity.getLat())));
				return entity;
			};
		}


		private Supplier<SourceLocationEntity> createSupplier(UserDataSource dataSource, LocationClass locationClass) {
			return ()-> {
				SourceLocationEntity sle = new SourceLocationEntity();
				sle.setDataSource(dataSource);
				sle.setLocationClass(locationClass);
				return sle;
			};
		}

		ColumnDefinitions<SourceLocationEntity> createColumnDefinitions(){
			ColumnDefinitions<SourceLocationEntity> columnDefinitions = new ColumnDefinitions<>();
			columnDefinitions.add("entity_category_id", (value, bean) -> bean.setEntityCategoryId(TypeConverterFactory.FACTORY.getConverter(Integer.class).convert(value)));
			columnDefinitions.add("lat", (value, bean) -> bean.setLat(TypeConverterFactory.FACTORY.getConverter(Double.class).convert(value)));
			columnDefinitions.add("longitude", (value, bean) -> bean.setLongitude(TypeConverterFactory.FACTORY.getConverter(Double.class).convert(value)));

			columnDefinitions.setDefault(columnName -> (String value, SourceLocationEntity bean) -> bean.getCustomAttributes().put(columnName,value));
			return columnDefinitions;
		}


	}



	interface BoundColumn<T>{
		void update(String value, T bean);
	}

	static class ColumnDefinitions<T>{
		private Map<String, BoundColumn<T>> mappings = new HashMap<>();
		private Function<String, BoundColumn<T>> defaultBinding;

		void add(String value, BoundColumn<T> boundColumn){
			mappings.put(value, boundColumn);
		}

		void setDefault(Function<String, BoundColumn<T>> defaultBinding){

			this.defaultBinding = defaultBinding;
		}

		BoundColumn<T> getMapping(String columnName){
			if(mappings.containsKey(columnName)) {
				return mappings.get(columnName);
			}else {
				return defaultBinding.apply(columnName);
			}
		}

		Function<String[], T> bindHeader(String[] header, Supplier<T> t){
			CSVMapper<T> tcsvMapper = new CSVMapper<>(Arrays.stream(header)
					.map(this::getMapping)
					.collect(Collectors.toList()), t);
			return tcsvMapper::mapRow;

		}
	}




	static class TypeConverterFactory{
		private Map<Class<?>, TypeConverter<?>> map = new HashMap<>();

		static TypeConverterFactory FACTORY = new TypeConverterFactory();

		private  TypeConverterFactory(){
			init();
		}

		private void init() {
			map.put(Double.class, s -> s == null ?  null : Double.parseDouble(s));
			map.put(String.class, s -> s );
			map.put(Integer.class, s -> s == null ?  null : Integer.parseInt(s));
			map.put(Long.class, s -> s == null ?  null : Long.parseLong(s));
		}

		<T> TypeConverter<T> getConverter(Class<T> tClass){
			return (TypeConverter<T>) map.get(tClass);
		}
	}
	interface TypeConverter<T>{
		T convert(String s);
	}



	static class CSVMapper<T>{
		List<BoundColumn<T>> mappedColumns;
		Supplier<T> beanSupplier;

		public CSVMapper(List<BoundColumn<T>> mappedColumns, Supplier<T> beanSupplier) {
			this.mappedColumns = mappedColumns;
			this.beanSupplier = beanSupplier;
		}

		T mapRow(String[] rawData){
			T bean = beanSupplier.get();
			IntStream.range(0, rawData.length)
					.forEach(
							idx -> mappedColumns
									.get(idx)
									.update(rawData[idx], bean)
					);
			return bean;
		}


	}

	//
	//
	//
	/*

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

	*/
}
