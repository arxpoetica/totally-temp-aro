package com.altvil.aro.persistence.repository;

import com.altvil.aro.persistence.repository.model.BusinessReportElement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Service
public class BusinessesReportRepository {


    @Autowired
            @Qualifier("entityManager")
    EntityManager jdbcTemplate;


    public Collection<BusinessReportElement> getTotals(long planId, double[] distanceThresholds, String locationSource, double mrcThreshold) {
        return Arrays.stream(distanceThresholds)
                .mapToObj(threshold ->{
                    Query query = jdbcTemplate.createNativeQuery("SELECT cast (count(biz.id) as double precision) , coalesce(cast(sum(biz.annual_recurring_cost) as double precision),0) \n" +
                            "FROM aro.businesses biz \n" +
                            "where id in(\n" +
                            "\tselect biz.id \n" +
                            "\tFROM aro.businesses biz\n" +
                            "\tJOIN client.fiber_route fr ON\n" +
                            "\tfr.plan_id = :planId\n" +
                            "\tAND   ST_Contains( cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry),biz.geom)\n" +
                            "\tAND biz.source = :source \n" +
                            "\tAND biz.monthly_recurring_cost >= :mrc\n" +
                            "\t)");
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
                    Query query = jdbcTemplate.createNativeQuery("select bs.size_name,  cast(coalesce(count(building.location_id),0) as double precision) from " +
                            "(\n" +
                            "    select loc.id as location_id, sum(biz.number_of_employees) building_employees\n" +
                            "    FROM  (\n" +
                            "    select distinct l.id from locations l\n" +
                            "    JOIN client.fiber_route fr ON\n" +
                            "\tfr.plan_id = :planId\n" +
                            "\tAND   ST_Contains( cast (st_buffer(cast (fr.geom as geography), :threshold) as geometry),l.geom)\n" +
                            "\t) loc\n" +
                            "    join aro.businesses biz\n" +
                            "    on loc.id = biz.location_id\n" +
                            "    AND coalesce(biz.monthly_recurring_cost,0) >= :mrc\n" +
                            "    AND biz.source = :source \n" +
                            "    group by 1\n" +
                            "    ) building\n" +
                            " right join client.businesses_sizes bs \n" +
                            "on bs.min_value <= building.building_employees and bs.max_value >= building.building_employees\n" +
                            "group by bs.size_name\n" +
                            "\n");
                    query.setParameter("threshold", threshold);
                    query.setParameter("planId", planId);
                    query.setParameter("source", locationSource);
                    query.setParameter("mrc", mrcThreshold);
                    List<Object[]> result = (List<Object[]>) query.getResultList();
                    return result.stream().map( arr -> new BusinessReportElement(threshold, (String)arr[0], (Double)arr[1]) );
                }).flatMap(Function.identity())
                .collect(Collectors.toList());
    }


}
