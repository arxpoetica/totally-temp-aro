package com.altvil.netop.json.mixin;

import com.altvil.netop.json.FiberPlanAlgorithmDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(using = FiberPlanAlgorithmDeserializer.class)
public interface FiberPlanAlgorithmMixin {
}
