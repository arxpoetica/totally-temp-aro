package com.altvil.aro.service.network.impl;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.DataSourceScope;

import java.util.*;

public class DefaultDataSourceScope implements DataSourceScope {
    private Map<LocationEntityType, Set<Long>> map  = new EnumMap<>(LocationEntityType.class);

    final public static DataSourceScope SCOPE = new DefaultDataSourceScope();

    private DefaultDataSourceScope(){
        Arrays.stream(LocationEntityType.values())
                .forEach(let -> map.put(let, Collections.singleton(1l)));
    }

    public DefaultDataSourceScope(Map<LocationEntityType, Set<Long>> map) {
        this.map = map;
    }

    @Override
    public Set<Long> getDataSourceIds(LocationEntityType let) {
        return map.get(let);
    }

    @Override
    public Modifier modify() {
        return new ScopeModifier();
    }

    private class ScopeModifier implements Modifier {
        private Map<LocationEntityType, Set<Long>> map  = new EnumMap<>(LocationEntityType.class);

        ScopeModifier(){
            this.map.putAll(DefaultDataSourceScope.this.map);
        }

        @Override
        public Modifier extendScope(LocationEntityType let, Set<Long> dataSourceIds) {

            Set<Long> allIds = new HashSet<>(map.get(let));
            allIds.addAll(dataSourceIds);
            map.put(let, allIds);
            return this;
        }

        @Override
        public Modifier extendScope(LocationEntityType let, Long dataSourceId) {
            this.extendScope(let, Collections.singleton(dataSourceId));
            return this;
        }

        @Override
        public DataSourceScope resolve() {
            return new DefaultDataSourceScope(map);
        }
    }
}
