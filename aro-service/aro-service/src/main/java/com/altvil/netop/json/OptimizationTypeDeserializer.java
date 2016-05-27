package com.altvil.netop.json;

import java.io.IOException;

import com.altvil.enumerations.OptimizationType;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

public class OptimizationTypeDeserializer extends JsonDeserializer<OptimizationType> {
	@Override
	public OptimizationType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
		JsonNode node = p.getCodec().readTree(p);
		
		String algorithmName = node.asText("undefined");
		
		algorithmName = algorithmName.trim().toUpperCase();

		if ("UNDEFINED".equals(algorithmName)) {
			return null;
		}

		return OptimizationType.valueOf(algorithmName);
	}
}
