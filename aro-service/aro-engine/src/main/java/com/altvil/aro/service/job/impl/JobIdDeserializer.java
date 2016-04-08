package com.altvil.aro.service.job.impl;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.Job.Id;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

public class JobIdDeserializer extends JsonDeserializer<Job.Id> implements JobIdSerialization {
	@Override
	public Id deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
		JsonNode node = p.getCodec().readTree(p);
		
		long id = -1;
		Map<String, Object> meta = new HashMap<>();
		
		for(Iterator<Entry<String, JsonNode>> itr = node.fields(); itr.hasNext();) {
			Entry<String, JsonNode> entry = itr.next();
			String key = entry.getKey();
			JsonNode value = entry.getValue();
			
			if (GUID_FIELD_NAME.equals(key)) {
				id = value.asLong();
			} else {
				Object object = p.getCodec().treeToValue(value, Object.class);
				meta.put(key,  object);
			}
		}
		
		return new JobIdImpl(id, meta);
	}
}
