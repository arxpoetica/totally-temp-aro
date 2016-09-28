package com.altvil.netop.processing;

import com.altvil.aro.model.ServiceLayer;

public class AroServiceLayer {
    private Integer id;
    private String name;
    private String description;
    private boolean userDefined;

    public AroServiceLayer(){}

    public AroServiceLayer(ServiceLayer serviceLayer){
        this.id = serviceLayer.getId();
        this.name = serviceLayer.getName();
        this.description = serviceLayer.getDescription();
        this.userDefined = serviceLayer.isUserDefined();
    }


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isUserDefined() {
        return userDefined;
    }

    public void setUserDefined(boolean userDefined) {
        this.userDefined = userDefined;
    }
}
