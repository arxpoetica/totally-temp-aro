package com.altvil.netop.json;

import java.io.IOException;
import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

public class NetworkAlgorithmDeserializer extends JsonDeserializer<NetworkConfiguration.Algorithm> {
	@Override
	public NetworkConfiguration.Algorithm deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
		JsonNode node = p.getCodec().readTree(p);
		
		String algorithmName = node.asText("undefined");
		
		algorithmName = algorithmName.trim().toUpperCase();

		if ("UNDEFINED".equals(algorithmName)) {
			return NetworkConfiguration.Algorithm.WEIGHT_MINIMIZATION;
		}

		return NetworkConfiguration.Algorithm.valueOf(algorithmName);
	}
}
