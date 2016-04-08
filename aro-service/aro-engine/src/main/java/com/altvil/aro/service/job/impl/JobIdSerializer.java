package com.altvil.aro.service.job.impl;

import java.io.IOException;
import java.util.Map;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.Job.Id;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

public class JobIdSerializer extends JsonSerializer<Job.Id> implements JobIdSerialization {
	@Override
	public void serialize(Id value, JsonGenerator gen, SerializerProvider serializers)
			throws IOException, JsonProcessingException {
		JobIdImpl jobId = (JobIdImpl) value;
		
		gen.writeStartObject();
		gen.writeNumberField(GUID_FIELD_NAME, jobId.getId());
		for(Map.Entry<String, Object> entry : jobId.getMeta().entrySet()) {
			gen.writeObjectField(entry.getKey(), entry.getValue());
		}
		
		gen.writeEndObject();
	}
}
