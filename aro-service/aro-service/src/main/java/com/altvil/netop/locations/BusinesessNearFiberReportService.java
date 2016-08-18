package com.altvil.netop.locations;

import com.altvil.aro.persistence.repository.BusinessesReportRepository;
import com.altvil.aro.persistence.repository.model.BusinessReportElement;
import com.altvil.netop.locations.model.BusinessDataByDistance;
import com.altvil.netop.locations.model.BusinessesReportRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BusinesessNearFiberReportService {
    @Autowired
    BusinessesReportRepository repository;

    public List<BusinessDataByDistance> getTotals(BusinessesReportRequest request) {

        Collection<BusinessReportElement> elements = repository.getTotals(request.getPlanId(), request.getDistanceThresholds(), request.getLocationSource(), request.getMrcThreshold());
        return aggregateElements(elements);

    }

    private List<BusinessDataByDistance> aggregateElements(Collection<BusinessReportElement> elements) {
        return elements.stream()
                .map(element -> new BusinessDataByDistance(element.getDistance(), element.getKey(), element.getValue()))
                .collect(Collectors.toList());
    }


}
