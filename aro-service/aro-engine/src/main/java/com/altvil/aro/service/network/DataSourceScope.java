package com.altvil.aro.service.network;

import com.altvil.aro.service.cu.cache.query.Fingerprintable;
import com.altvil.aro.service.entity.LocationEntityType;

import java.io.Serializable;
import java.util.Collection;
import java.util.Set;

public interface DataSourceScope extends Serializable, Fingerprintable{

    Set<Long> getDataSourceIds(LocationEntityType let);
    Modifier modify();

    interface Modifier{
        Modifier extendScope(LocationEntityType let, Set<Long> dataSourceIds);
        Modifier extendScope(LocationEntityType let, Long dataSourceId);
        DataSourceScope resolve();

    }
}
