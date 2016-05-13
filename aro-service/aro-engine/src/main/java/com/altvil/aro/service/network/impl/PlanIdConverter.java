package com.altvil.aro.service.network.impl;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

import com.altvil.aro.service.network.PlanId;

@Converter
public class PlanIdConverter implements AttributeConverter<PlanId, Long> {
	@Override
	public Long convertToDatabaseColumn(PlanId attribute) {
		return attribute == null ? null : attribute.longValue();
	}

	@Override
	public PlanId convertToEntityAttribute(Long dbData) {
		return dbData == null ? null : new PlanId(dbData.longValue());
	}
}
