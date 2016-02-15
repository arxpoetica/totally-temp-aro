package com.altvil.netop.newapi;

import java.util.Collection;
import java.util.Date;

/**
 * Created by E535 on 2016-02-03.
 */
public class DeleteRequest {

    Collection<Integer> serviceAreaIds;
    Date deploymentDate;
    Integer deploymentPlanId;

    public Collection<Integer> getServiceAreaIds() {
        return serviceAreaIds;
    }

    public void setServiceAreaIds(Collection<Integer> serviceAreaIds) {
        this.serviceAreaIds = serviceAreaIds;
    }

    public Date getDeploymentDate() {
        return deploymentDate;
    }

    public void setDeploymentDate(Date deploymentDate) {
        this.deploymentDate = deploymentDate;
    }

    public Integer getDeploymentPlanId() {
        return deploymentPlanId;
    }

    public void setDeploymentPlanId(Integer deploymentPlanId) {
        this.deploymentPlanId = deploymentPlanId;
    }
}
