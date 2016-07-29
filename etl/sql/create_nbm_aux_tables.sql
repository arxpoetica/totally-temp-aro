-- Additional table creation and processing for nbm source


-- This REALLY shouldn't be here. It's client-specific so should be in a client-specific portion of the ETL.
-- Or probably not in the ETL at all, since we should be handling stuff like this at the application level, not in the data.
DROP TABLE IF EXISTS nbm.competitor_speed_category ;
CREATE TABLE nbm.competitor_speed_category as 
select
gid,
provname, 
stateabbr,
max(
case when maxaddown = 2 then 1
    when maxaddown = 3 then 2
    when maxaddown = 4 then 2
    when maxaddown = 5 then 3
    when maxaddown = 6 then 3
    when maxaddown = 7 then 4
    when maxaddown = 8 then 5
    when maxaddown = 9 then 6
    when maxaddown = 10 then 7
    else 10
    end) as speed_category
from nbm.blocks n 
join tiger.tabblock b on b.tabblock_id = n.fullfipsid
where name not like '%Verizon%'
group by b.gid, provname, stateabbr;

CREATE INDEX nbm_competitor_speed_category_gid_index ON nbm.competitor_speed_category(gid);
CREATE INDEX nbm_competitor_speed_category_stateabbr_index ON nbm.competitor_speed_category(stateabbr);



DROP TABLE IF EXISTS nbm.brand_strength ;
CREATE TABLE nbm.brand_strength as 
select 
distinct provname, stateabbr, 1.0 as brand_strength
from  nbm.competitor_speed_category ;

CREATE INDEX nbm_brand_strength_provname_index ON nbm.brand_strength(provname);
CREATE INDEX nbm_brand_strength_stateabbr_index ON nbm.brand_strength(stateabbr);