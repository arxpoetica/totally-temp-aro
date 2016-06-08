package com.altvil.netop.json.mixin;

import com.altvil.netop.json.OptimizationTypeDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(using = OptimizationTypeDeserializer.class)
public interface OptimizationTypeMixin {
}
