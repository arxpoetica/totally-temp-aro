package com.altvil.aro.persistence.repository;

import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.model.WirecenterPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface WirecenterPlanRepository extends JpaRepository<WirecenterPlan, Long> {

    @Modifying
    @Transactional
    @Query(value="WITH root_plans AS (\n" +
            "	SELECT\n" +
            "		m.name as master_name,\n" +
            "		m.id as master_plan_id,\n" +
            "		h.*\n" +
            "	FROM client.plan m, client.plan h \n" +
            "	WHERE m.id = :planId\n" +
            "	AND h.plan_type='H' \n" +
            "	AND h.wirecenter_id IN (:wireCentersIds) \n" +
            ")\n" +
            ",\n" +
            "new_plans as (\n" +
            "	INSERT INTO client.plan\n" +
            "		(service_layer_id, name, plan_type, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at, parent_plan_id)\n" +
            "	SELECT\n" +
            "		r.service_layer_id,\n" +
            "		r.master_name,\n" +
            "		'W',\n" +
            "		r.wirecenter_id,\n" +
            "		r.area_name,\n" +
            "		r.area_centroid,\n" +
            "		r.area_bounds,\n" +
            "		NOW(),\n" +
            "		NOW(),\n" +
            "		r.master_plan_id \n" +
            "	FROM root_plans r\n" +
            "	RETURNING\n" +
            "		id,\n" +
            "		parent_plan_id as master_plan_id,\n" +
            "		wirecenter_id, area_centroid \n" +
            ")\n" +
            ",\n" +
            "updated_network_nodes AS (\n" +
            "	INSERT INTO client.network_nodes\n" +
            "		(plan_id, node_type_id, geog, geom)\n" +
            "	SELECT\n" +
            "		p.id,\n" +
            "		n.node_type_id,\n" +
            "		n.geog,\n" +
            "		n.geom\n" +
            "	FROM root_plans r\n" +
            "	JOIN new_plans p on p.wirecenter_id = r.wirecenter_id\n" +
            "	JOIN client.network_nodes n on n.plan_id = r.id\n" +
            "	WHERE n.node_type_id in(1)\n" +
            "	RETURNING plan_id\n" +
            ")\n" +
            "select * from client.plan where id in ("+
            "SELECT DISTINCT plan_id \n" +
            "FROM updated_network_nodes\n" +
            ")", nativeQuery = true)
    Collection<WirecenterPlan> computeWirecenterUpdates(@Param("planId") long planId, @Param("wireCentersIds") Collection<Integer> wireCentersIds);


}
