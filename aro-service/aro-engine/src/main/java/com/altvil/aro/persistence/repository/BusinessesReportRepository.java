package com.altvil.aro.persistence.repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.OptionalDouble;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.persistence.EntityManager;
import javax.persistence.Query;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.model.BusinessReportElement;

@Service
public class BusinessesReportRepository {

	@Autowired
	@Qualifier("entityManager")
	EntityManager jdbcTemplate;

	private interface RowExtractor<T> extends Function<Object[], T> {
		T apply(Object[] row);
	}

	public class ElementExtractor implements
			RowExtractor<Collection<BusinessReportElement>> {

		private double threshold;

		public ElementExtractor(double threshold) {
			super();
			this.threshold = threshold;
		}

		@Override
		public Collection<BusinessReportElement> apply(Object[] row) {
			return Arrays.asList(new BusinessReportElement(threshold, "Count",
					(Double) row[0]), new BusinessReportElement(threshold,
					"MRC", (Double) row[1]));
		}

	}

	private class Executor<T> {

		private String sql;
		private RowExtractor<T> f;

		private List<T> result = new ArrayList<>();

		public Executor(String sql, RowExtractor<T> f) {
			super();
			this.sql = sql;
			this.f = f;
		}

		@SuppressWarnings("unchecked")
		public Executor<T> add(Consumer<Query> binder) {
			Query query = jdbcTemplate.createNativeQuery(sql);
			binder.accept(query);
			query.getResultList().forEach(r -> {
				result.add(f.apply((Object[]) r));
			});
			return this;
		}

		public List<T> getResult() {
			return result;
		}
	}

	private <T> Collection<T> execute(String sql, RowExtractor<T> f,
			Consumer<Query> binder) {
		return new Executor<T>(sql, f).add(binder).getResult();
	}

	private Stream<BusinessReportElement> execute(String sql,
			double threshhold, Consumer<Query> binder) {
		return execute(sql, new ElementExtractor(threshhold), binder).stream()
				.flatMap(Collection::stream);
	}

	public Collection<BusinessReportElement> getTotals(long planId,
			double[] distanceThresholds, String locationSource,
			double mrcThreshold) {
		return Arrays
				.stream(distanceThresholds)
				.mapToObj(
						d -> execute(
								"\n"
										+ "with \n"
										+ "plan_ids as (select p.id from client.plan p where p.id = :planId or p.parent_plan_id = :planId  ),\n"
										+ "locIds as ( select l.id\n"
										+ "\tfrom client.plan p\n"
										+ "\tinner join plan_ids\n"
										+ "\ton p.id = plan_ids.id\n"
										+ "\tinner join client.service_area w \n"
										+ "\t\ton p.wirecenter_id =  w.id\n"
										+ "\t inner join aro.locations l \n"
										+ "\t\ton ST_Contains(w.geom, l.geom)\n"
										+ "\t),\n"
										+ "buffered_routes as (\n"
										+ "\tselect cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry) shape \n"
										+ "\tfrom client.fiber_route fr \n"
										+ "\tjoin plan_ids pid on fr.plan_id = pid.id \n"
										+ ")\n"
										+ "SELECT cast (count(biz.id) as double precision) , coalesce(cast(sum(biz.annual_recurring_cost) as double precision),0) \n"
										+ " \n"
										+ "                            FROM aro.businesses biz  \n"
										+ "                            where id in( \n"
										+ "                            select biz.id  \n"
										+ "                            FROM locIds \n"
										+ "                            join aro.businesses biz \n"
										+ "                            on locIds.id = biz.location_id\n"
										+ "                            JOIN buffered_routes fr ON \n"
										+ "\t\t\t\tST_Contains( fr.shape,biz.geom) \n"
										+ "                            AND biz.source = :source  \n"
										+ "                            \tAND biz.monthly_recurring_cost >= :mrc\n"
										+ "                            \t)",
								d,
								(query) -> {
									query.setParameter("threshold", d);
									query.setParameter("planId", planId);
									query.setParameter("source", locationSource);
									query.setParameter("mrc", mrcThreshold);
								})).flatMap(Function.identity())
				.collect(Collectors.toList());
	}

	public Collection<BusinessReportElement> getBuildingsCountsByBusinessesSizes(
			long planId, double[] distanceThresholds, String locationSource,
			double mrcThreshold) {

		return Arrays
				.stream(distanceThresholds)
				.mapToObj(
						d -> execute(
								"\n"
										+ "with \n"
										+ "plan_ids as (select p.id from client.plan p where p.id = :planId or p.parent_plan_id = :planId  ),\n"
										+ "locIds as ( select l.id\n"
										+ "\tfrom client.plan p\n"
										+ "\tinner join plan_ids\n"
										+ "\ton p.id = plan_ids.id\n"
										+ "\tinner join client.service_area w \n"
										+ "\t\ton p.wirecenter_id =  w.id\n"
										+ "\t inner join aro.locations l \n"
										+ "\t\ton ST_Contains(w.geom, l.geom)\n"
										+ "\t),\n"
										+ "buffered_routes as (\n"
										+ "\tselect cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry) shape \n"
										+ "\tfrom client.fiber_route fr \n"
										+ "\tjoin plan_ids pid on fr.plan_id = pid.id \n"
										+ ")\n"
										+ "\n"
										+ "select bs.size_name,  cast(coalesce(count(building.location_id),0) as double precision) from  \n"
										+ "                            ( \n"
										+ "                                select loc.id as location_id, sum(biz.number_of_employees) building_employees \n"
										+ "                                FROM  ( \n"
										+ "                                select distinct l.id from \n"
										+ "\t\t\t\tlocIds \n"
										+ "                                join locations l \n"
										+ "                                on locIds.id = l.id\n"
										+ "                                JOIN buffered_routes fr ON \n"
										+ "\t\t\t\t\tST_Contains( fr.shape, l.geom) \n"
										+ "                            ) loc \n"
										+ "                                join aro.businesses biz \n"
										+ "                                on loc.id = biz.location_id \n"
										+ "                                AND coalesce(biz.monthly_recurring_cost,0) >= :mrc \n"
										+ "                                AND biz.source = :source  \n"
										+ "                                group by 1 \n"
										+ "                                ) building \n"
										+ "                             right join client.businesses_sizes bs  \n"
										+ "                            on bs.min_value <= building.building_employees and bs.max_value >= building.building_employees \n"
										+ "                            group by bs.size_name",
								d,
								(query) -> {
									query.setParameter("threshold", d);
									query.setParameter("planId", planId);
									query.setParameter("source", locationSource);
									query.setParameter("mrc", mrcThreshold);
								})).flatMap(Function.identity())
				.collect(Collectors.toList());

	}

	public Collection<BusinessReportElement> getBusinessesCountsBySizes(
			long planId, double[] distanceThresholds, String locationSource,
			double mrcThreshold) {
		return Arrays
				.stream(distanceThresholds)
				.mapToObj(
						d -> (Collection<BusinessReportElement>) execute(
								"\n"
										+ "with \n"
										+ "plan_ids as (select p.id from client.plan p where p.id = :planId or p.parent_plan_id = :planId  ),\n"
										+ "locIds as ( select l.id\n"
										+ "\tfrom client.plan p\n"
										+ "\tinner join plan_ids\n"
										+ "\ton p.id = plan_ids.id\n"
										+ "\tinner join client.service_area w \n"
										+ "\t\ton p.wirecenter_id =  w.id\n"
										+ "\t inner join aro.locations l \n"
										+ "\t\ton ST_Contains(w.geom, l.geom)\n"
										+ "\t),\n"
										+ "buffered_routes as (\n"
										+ "\tselect cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry) shape \n"
										+ "\tfrom client.fiber_route fr \n"
										+ "\tjoin plan_ids pid on fr.plan_id = pid.id \n"
										+ ")\n"
										+ "select bs.size_name,  cast(coalesce(count(businesses.biz_id),0) as double precision) from \n"
										+ "                            ( \n"
										+ "                                select biz.id as biz_id, biz.number_of_employees  \n"
										+ "                                FROM  ( \n"
										+ "                                select distinct biz.id from \n"
										+ "\t\t\t\tlocIds \n"
										+ "                                join aro.businesses biz \n"
										+ "                                on locIds.id = biz.location_id\n"
										+ "                                JOIN buffered_routes fr ON \n"
										+ "\t\t\t\tST_Contains( fr.shape, biz.geom) \n"
										+ "                             AND coalesce(biz.monthly_recurring_cost,0) >= :mrc \n"
										+ "                            AND biz.source = :source  \n"
										+ "                            ) biz_ids \n"
										+ "                                join aro.businesses biz \n"
										+ "                                on biz_ids.id = biz.id \n"
										+ "                                ) businesses  \n"
										+ "                             right join client.businesses_sizes bs  \n"
										+ "                            on bs.min_value <= businesses.number_of_employees and bs.max_value >= businesses.number_of_employees \n"
										+ "                            group by bs.size_name",
								(row) -> new BusinessReportElement(d,
										(String) row[0], (Double) row[1]),
								(query) -> {
									query.setParameter("threshold", d);
									query.setParameter("planId", planId);
									query.setParameter("source", locationSource);
									query.setParameter("mrc", mrcThreshold);
								})).flatMap(Collection::stream)
				.collect(Collectors.toList());

	}

	public String getBusinesses(long planId, double[] distanceThresholds,
			String locationSource, double mrcThreshold) {
		OptionalDouble threshold = Arrays.stream(distanceThresholds).max();
		if (threshold.isPresent()) {
			Query query = jdbcTemplate
					.createNativeQuery("    select biz.*, biz_ids.distance\n"
							+ "    FROM  (\n"
							+ "    select biz.id, min(ST_DISTANCE( cast (fr.geom as geography), cast(biz.geom as geography))) as distance from aro.businesses biz\n"
							+ "    JOIN client.fiber_route fr ON\n"
							+ "\tfr.plan_id = :planId\n"
							+ "\tAND   ST_Contains( cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry),biz.geom)\n"
							+ "\t AND coalesce(biz.monthly_recurring_cost,0) >= :mrc\n"
							+ "\tAND biz.source = :source \n"
							+ "\tgroup by 1\n" + "\t) biz_ids\n"
							+ "    join aro.businesses biz\n"
							+ "    on biz_ids.id = biz.id\n" + "    ");
			query.setParameter("threshold", threshold);
			query.setParameter("planId", planId);
			query.setParameter("source", locationSource);
			query.setParameter("mrc", mrcThreshold);
			@SuppressWarnings("unchecked")
			List<Object[]> result = (List<Object[]>) query.getResultList();
			return result.stream().map(this::mapBussinessRow)
					.collect(Collectors.joining("\n"));
		} else {
			return "";
		}

	}

	private String mapBussinessRow(Object[] objects) {
		return Arrays.stream(objects).map(this::quoteString)
				.map(Object::toString).collect(Collectors.joining(","));

	}

<<<<<<< HEAD
	private Object quoteString(Object o) {
		if (o instanceof String) {
			return '"' + o.toString() + '"';
		} else {
			return o;
		}
	}
=======
    @Autowired
            @Qualifier("entityManager")
    EntityManager jdbcTemplate;


    public Collection<BusinessReportElement> getTotals(long planId, double[] distanceThresholds, String locationSource, double mrcThreshold) {
        return Arrays.stream(distanceThresholds)
                .mapToObj(threshold ->{
                    Query query = jdbcTemplate.createNativeQuery("\n" +
                            "with \n" +
                            "plan_ids as (select p.id from client.plan p where p.id = :planId or p.parent_plan_id = :planId  ),\n" +
                            "locIds as ( select l.id\n" +
                            "\tfrom client.plan p\n" +
                            "\tinner join plan_ids\n" +
                            "\ton p.id = plan_ids.id\n" +
                            "\tinner join aro.wirecenters w \n" +
                            "\t\ton p.wirecenter_id =  w.id\n" +
                            "\t inner join aro.locations l \n" +
                            "\t\ton ST_Contains(w.geom, l.geom)\n" +
                            "\t),\n" +
                            "buffered_routes as (\n" +
                            "\tselect cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry) shape \n" +
                            "\tfrom client.fiber_route fr \n" +
                            "\tjoin plan_ids pid on fr.plan_id = pid.id \n" +
                            ")\n" +
                            "SELECT cast (count(biz.id) as double precision) , coalesce(cast(sum(biz.annual_recurring_cost) as double precision),0) \n" +
                            " \n" +
                            "                            FROM aro.businesses biz  \n" +
                            "                            where id in( \n" +
                            "                            select biz.id  \n" +
                            "                            FROM locIds \n" +
                            "                            join aro.businesses biz \n" +
                            "                            on locIds.id = biz.location_id\n" +
                            "                            JOIN buffered_routes fr ON \n" +
                            "\t\t\t\tST_Contains( fr.shape,biz.geom) \n" +
                            "                            AND biz.source = :source  \n" +
                            "                            \tAND biz.monthly_recurring_cost >= :mrc\n" +
                            "                            \t)");
                    query.setParameter("threshold", threshold);
                    query.setParameter("planId", planId);
                    query.setParameter("source", locationSource);
                    query.setParameter("mrc", mrcThreshold);
                    List<Object[]> result = (List<Object[]>) query.getResultList();
                    return result.stream().flatMap( arr -> Arrays.asList(new BusinessReportElement(threshold, "Count", (Double)arr[0]),
                            new BusinessReportElement(threshold, "MRC", (Double)arr[1])).stream());
                }).flatMap(Function.identity())
        .collect(Collectors.toList());
    }


    public Collection<BusinessReportElement> getBuildingsCountsByBusinessesSizes(long planId, double[] distanceThresholds, String locationSource, double mrcThreshold) {
        return Arrays.stream(distanceThresholds)
                .mapToObj(threshold ->{
                    Query query = jdbcTemplate.createNativeQuery("\n" +
                            "with \n" +
                            "plan_ids as (select p.id from client.plan p where p.id = :planId or p.parent_plan_id = :planId  ),\n" +
                            "locIds as ( select l.id\n" +
                            "\tfrom client.plan p\n" +
                            "\tinner join plan_ids\n" +
                            "\ton p.id = plan_ids.id\n" +
                            "\tinner join aro.wirecenters w \n" +
                            "\t\ton p.wirecenter_id =  w.id\n" +
                            "\t inner join aro.locations l \n" +
                            "\t\ton ST_Contains(w.geom, l.geom)\n" +
                            "\t),\n" +
                            "buffered_routes as (\n" +
                            "\tselect cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry) shape \n" +
                            "\tfrom client.fiber_route fr \n" +
                            "\tjoin plan_ids pid on fr.plan_id = pid.id \n" +
                            ")\n" +
                            "\n" +
                            "select bs.size_name,  cast(coalesce(count(building.location_id),0) as double precision) from  \n" +
                            "                            ( \n" +
                            "                                select loc.id as location_id, sum(biz.number_of_employees) building_employees \n" +
                            "                                FROM  ( \n" +
                            "                                select distinct l.id from \n" +
                            "\t\t\t\tlocIds \n" +
                            "                                join locations l \n" +
                            "                                on locIds.id = l.id\n" +
                            "                                JOIN buffered_routes fr ON \n" +
                            "\t\t\t\t\tST_Contains( fr.shape, l.geom) \n" +
                            "                            ) loc \n" +
                            "                                join aro.businesses biz \n" +
                            "                                on loc.id = biz.location_id \n" +
                            "                                AND coalesce(biz.monthly_recurring_cost,0) >= :mrc \n" +
                            "                                AND biz.source = :source  \n" +
                            "                                group by 1 \n" +
                            "                                ) building \n" +
                            "                             right join client.businesses_sizes bs  \n" +
                            "                            on bs.min_value <= building.building_employees and bs.max_value >= building.building_employees \n" +
                            "                            group by bs.size_name");
                    query.setParameter("threshold", threshold);
                    query.setParameter("planId", planId);
                    query.setParameter("source", locationSource);
                    query.setParameter("mrc", mrcThreshold);
                    List<Object[]> result = (List<Object[]>) query.getResultList();
                    return result.stream().map( arr -> new BusinessReportElement(threshold, (String)arr[0], (Double)arr[1]) );
                }).flatMap(Function.identity())
                .collect(Collectors.toList());
    }

    public Collection<BusinessReportElement> getBusinessesCountsBySizes(long planId, double[] distanceThresholds, String locationSource, double mrcThreshold) {
        return Arrays.stream(distanceThresholds)
                .mapToObj(threshold ->{
                    Query query = jdbcTemplate.createNativeQuery("\n" +
                            "with \n" +
                            "plan_ids as (select p.id from client.plan p where p.id = :planId or p.parent_plan_id = :planId  ),\n" +
                            "locIds as ( select l.id\n" +
                            "\tfrom client.plan p\n" +
                            "\tinner join plan_ids\n" +
                            "\ton p.id = plan_ids.id\n" +
                            "\tinner join aro.wirecenters w \n" +
                            "\t\ton p.wirecenter_id =  w.id\n" +
                            "\t inner join aro.locations l \n" +
                            "\t\ton ST_Contains(w.geom, l.geom)\n" +
                            "\t),\n" +
                            "buffered_routes as (\n" +
                            "\tselect cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry) shape \n" +
                            "\tfrom client.fiber_route fr \n" +
                            "\tjoin plan_ids pid on fr.plan_id = pid.id \n" +
                            ")\n" +
                            "select bs.size_name,  cast(coalesce(count(businesses.biz_id),0) as double precision) from \n" +
                            "                            ( \n" +
                            "                                select biz.id as biz_id, biz.number_of_employees  \n" +
                            "                                FROM  ( \n" +
                            "                                select distinct biz.id from \n" +
                            "\t\t\t\tlocIds \n" +
                            "                                join aro.businesses biz \n" +
                            "                                on locIds.id = biz.location_id\n" +
                            "                                JOIN buffered_routes fr ON \n" +
                            "\t\t\t\tST_Contains( fr.shape, biz.geom) \n" +
                            "                             AND coalesce(biz.monthly_recurring_cost,0) >= :mrc \n" +
                            "                            AND biz.source = :source  \n" +
                            "                            ) biz_ids \n" +
                            "                                join aro.businesses biz \n" +
                            "                                on biz_ids.id = biz.id \n" +
                            "                                ) businesses  \n" +
                            "                             right join client.businesses_sizes bs  \n" +
                            "                            on bs.min_value <= businesses.number_of_employees and bs.max_value >= businesses.number_of_employees \n" +
                            "                            group by bs.size_name");
                    query.setParameter("threshold", threshold);
                    query.setParameter("planId", planId);
                    query.setParameter("source", locationSource);
                    query.setParameter("mrc", mrcThreshold);
                    List<Object[]> result = (List<Object[]>) query.getResultList();
                    return result.stream().map( arr -> new BusinessReportElement(threshold, (String)arr[0], (Double)arr[1]) );
                }).flatMap(Function.identity())
                .collect(Collectors.toList());
    }

    public String getBusinesses(long planId, double[] distanceThresholds, String locationSource, double mrcThreshold) {
        OptionalDouble threshold = Arrays.stream(distanceThresholds).max();
        if (threshold.isPresent()) {
            Query query = jdbcTemplate.createNativeQuery("  with  \n" +
                    "    plan_ids as \n" +
                    "        (select p.id from client.plan p where p.id = :planId  or p.parent_plan_id = :planId   ), \n" +
                    "    locIds as ( select l.id \n" +
                    "        from client.plan p \n" +
                    "        inner join plan_ids \n" +
                    "        on p.id = plan_ids.id \n" +
                    "        inner join aro.wirecenters w  \n" +
                    "        on p.wirecenter_id =  w.id \n" +
                    "            inner join aro.locations l  \n" +
                    "        on ST_Contains(w.geom, l.geom) \n" +
                    "    ), \n" +
                    "    buffered_routes as ( \n" +
                    "        select cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry) shape , geom\n" +
                    "        from client.fiber_route fr  \n" +
                    "        join plan_ids pid on fr.plan_id = pid.id  \n" +
                    "    ) \n" +
                    " select biz.id ,biz.location_id, biz.industry_id, biz.name, biz.address,biz.number_of_employees, biz.annual_recurring_cost, biz.monthly_recurring_cost, biz.source, ST_X(biz.geom), ST_Y(biz.geom), biz_ids.distance\n" +
                    "                        FROM  ( \n" +
                    "                        select biz.id, min(ST_DISTANCE( cast (fr.geom as geography), cast(biz.geom as geography))) as distance \n" +
                    "                        from \n" +
                    "                            locIds \n" +
                    "                            join \n" +
                    "                            aro.businesses biz \n" +
                    "                            on locIds.id = biz.location_id\n" +
                    "                        JOIN buffered_routes fr ON \n" +
                    "                     ST_Contains(fr.shape, biz.geom) \n" +
                    "                     AND coalesce(biz.monthly_recurring_cost,0) >= :mrc\n" +
                    "                    AND biz.source = :source\n" +
                    "                    group by 1 \n" +
                    "                    ) biz_ids \n" +
                    "                        join aro.businesses biz \n" +
                    "                        on biz_ids.id = biz.id \n" +
                    "                        ;");
            query.setParameter("threshold", threshold.getAsDouble());
            query.setParameter("planId", planId);
            query.setParameter("source", locationSource);
            query.setParameter("mrc", mrcThreshold);
            List<Object[]> result = (List<Object[]>) query.getResultList();
            return " id,location_id,industry_id,name,address,number_of_employees,annual_recurring_cost,monthly_recurring_cost,source,longitude,lattitude,distance\n" +
                    result.stream().map(this::mapBussinessRow)
                    .collect(Collectors.joining("\n"));
        }else{
            return "";
        }

    }

    private String mapBussinessRow(Object[] objects) {
        return Arrays.stream(objects)
                .map(this::quoteString)
                .map(Object::toString)
                .collect(Collectors.joining(","));

    }

    private Object quoteString(Object o) {
        if(o instanceof String){
            return '"' + o.toString() + '"';
        }else{
            return o;
        }
    }
>>>>>>> develop
}
