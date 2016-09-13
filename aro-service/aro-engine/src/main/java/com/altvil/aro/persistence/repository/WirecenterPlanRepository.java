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
    @Query(value="WITH root_plans AS ( \n" +
            "            \tSELECT \n" +
            "            \t\tm.name as master_name, \n" +
            "            \t\tm.id as master_plan_id, \n" +
            "            \t\th.* \n" +
            "            \tFROM client.plan m, client.plan h  \n" +
            "            \tWHERE m.id = :planId \n" +
            "            \tAND h.plan_type='H'  \n" +
            "            \tAND h.wirecenter_id IN (:wireCentersIds)  \n" +
            "            ) \n" +
            "            , \n" +
            "            new_plans as ( \n" +
            "            \tINSERT INTO client.plan \n" +
            "            \t\t(service_layer_id, name, plan_type, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at, parent_plan_id) \n" +
            "            \tSELECT \n" +
            "            \t\tr.service_layer_id, \n" +
            "            \t\tr.master_name, \n" +
            "            \t\t'W', \n" +
            "            \t\tr.wirecenter_id, \n" +
            "            \t\tr.area_name, \n" +
            "            \t\tr.area_centroid, \n" +
            "            \t\tr.area_bounds, \n" +
            "            \t\tNOW(), \n" +
            "            \t\tNOW(), \n" +
            "            \t\tr.master_plan_id  \n" +
            "            \tFROM root_plans r \n" +
            "            \tRETURNING \n" +
            "            \t\tid, \n" +
            "            \t\tservice_layer_id, name, plan_type, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at, parent_plan_id, total_cost, total_count\n" +
            "            ) \n" +
            "            , \n" +
            "            updated_network_nodes AS ( \n" +
            "            \tINSERT INTO client.network_nodes \n" +
            "            \t\t(plan_id, node_type_id, geog, geom) \n" +
            "            \tSELECT \n" +
            "            \t\tp.id, \n" +
            "            \t\tn.node_type_id, \n" +
            "            \t\tn.geog, \n" +
            "            \t\tn.geom \n" +
            "            \tFROM root_plans r \n" +
            "            \tJOIN new_plans p on p.wirecenter_id = r.wirecenter_id \n" +
            "            \tJOIN client.network_nodes n on n.plan_id = r.id \n" +
            "            \tWHERE n.node_type_id in(1) \n" +
            "            \tRETURNING plan_id \n" +
            "            ) \n" +
            "            select * from new_plans where id in (\n" +
            "            SELECT DISTINCT plan_id  \n" +
            "            FROM updated_network_nodes\n" +
            "        )", nativeQuery = true)
    Collection<WirecenterPlan> computeWirecenterUpdates(@Param("planId") long planId, @Param("wireCentersIds") Collection<Integer> wireCentersIds);


}
