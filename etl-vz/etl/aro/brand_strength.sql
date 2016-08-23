DROP TABLE IF EXISTS nbm.brand_strength ;
CREATE TABLE nbm.brand_strength as 
select 
distinct provname, stateabbr, 1.0 as brand_strength
from  nbm.competitor_speed_category ;

CREATE INDEX nbm_brand_strength_provname_index ON nbm.brand_strength(provname);
CREATE INDEX nbm_brand_strength_stateabbr_index ON nbm.brand_strength(stateabbr);
