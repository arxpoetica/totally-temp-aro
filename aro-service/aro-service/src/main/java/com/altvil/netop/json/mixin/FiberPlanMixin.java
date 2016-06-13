package com.altvil.netop.json.mixin;

import com.altvil.netop.json.FiberPlanRequestTypeIdResolver;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;

@JsonTypeInfo(use = JsonTypeInfo.Id.CUSTOM, include=JsonTypeInfo.As.PROPERTY, property="algorithm")
@JsonIgnoreProperties(value={"closestFirstSurfaceBuilder", "filteringRoadLocationDemandsBySelection", "filteringRoadLocationsBySelection"}, ignoreUnknown = true)
@JsonTypeIdResolver(FiberPlanRequestTypeIdResolver.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FiberPlanMixin {

}
