package com.altvil.netop.json.mixin;

import com.altvil.netop.json.OptimizationPlanRequestTypeIdResolver;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;

@JsonTypeInfo(use = JsonTypeInfo.Id.CUSTOM, include=JsonTypeInfo.As.PROPERTY, property="algorithm")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeIdResolver(OptimizationPlanRequestTypeIdResolver.class)

public interface OptimizationPlanMixin {

}
