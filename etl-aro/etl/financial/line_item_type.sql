DROP TABLE IF EXISTS "financial"."line_item_type";
create table financial.line_item_type (
	"id" serial PRIMARY KEY,
	"name" varchar(32) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE financial.line_item_type OWNER TO "aro";

insert into financial.line_item_type (name, description) 
	values('cost','Cost') ;

insert into financial.line_item_type (name, description) 
	values('irr','Internal Rate Return') ;

insert into financial.line_item_type (name, description) 
	values('npv','Net Present Value') ;

-- House Holds

insert into financial.line_item_type (name, description) 
	values('household.atomic_count','Household Fiber Units') ;

insert into financial.line_item_type (name, description) 
	values('household.premises','Household Premises Passed') ;

insert into financial.line_item_type (name, description) 
	values('household.demand','Household  Fair Share Demand') ;

insert into financial.line_item_type (name, description) 
	values('household.gross.revenue','Household Gross Faire Share Revenue') ;

insert into financial.line_item_type (name, description) 
	values('household.marginal.revenue','Household  Marginal Faire Share Revenue') ;	

-- SMB 

insert into financial.line_item_type (name, description) 
	values('smb.atomic_count','Small Business Fiber Units') ;

insert into financial.line_item_type (name, description) 
	values('smb.premises','Small Business Premises Passed') ;

insert into financial.line_item_type (name, description) 
	values('smb.demand','Small Business Fair Share Demand') ;

insert into financial.line_item_type (name, description) 
	values('smb.gross.revenue','Small Business  Gross Faire Share Revenue') ;

insert into financial.line_item_type (name, description) 
	values('smb.marginal.revenue','Small Business  Marginal Faire Share Revenue') ;	


-- MBU 

insert into financial.line_item_type (name, description) 
	values('mbu.atomic_count','Medium Business Fiber Units') ;

insert into financial.line_item_type (name, description) 
	values('mbu.premises','Medium Business  Premise Passed') ;

insert into financial.line_item_type (name, description) 
	values('mbu.demand','Medium Business Fair Share Demand') ;

insert into financial.line_item_type (name, description) 
	values('mbu.gross.revenue','Medium Business Gross Faire Share Revenue') ;

insert into financial.line_item_type (name, description) 
	values('mbu.marginal.revenue','Medium Business  Marginal Faire Share Revenue') ;	


-- Large Business Unit Holds

insert into financial.line_item_type (name, description) 
	values('lbu.atomic_count','Large Business Fiber Units') ;

insert into financial.line_item_type (name, description) 
	values('lbu.premises','Large Business Premise Passed') ;

insert into financial.line_item_type (name, description) 
	values('lbu.demand','Large Business Fair Share Demand') ;

insert into financial.line_item_type (name, description) 
	values('lbu.gross.revenue','Large Business Gross Faire Share Revenue') ;

insert into financial.line_item_type (name, description) 
	values('lbu.marginal.revenue','Large Business Marginal Faire Share Revenue') ;	


-- Cell Towers

insert into financial.line_item_type (name, description) 
	values('celltower.atomic_count','Cell Tower Fiber Units') ;

insert into financial.line_item_type (name, description) 
	values('celltower.premises','Cell Tower Premise Passed') ;

insert into financial.line_item_type (name, description) 
	values('celltower.demand','Cell Tower Fair Share Demand') ;

insert into financial.line_item_type (name, description) 
	values('celltower.gross.revenue','Cell Tower Gross Faire Share Revenue') ;

insert into financial.line_item_type (name, description) 
	values('celltower.marginal.revenue','Cell Tower Marginal Faire Share Revenue') ;	


-- Totals

insert into financial.line_item_type (name, description) 
	values('total.atomic_count','Total Fiber Units') ;

insert into financial.line_item_type (name, description) 
	values('total.premises','Total Premise Passed') ;

insert into financial.line_item_type (name, description) 
	values('total.demand','Total Fair Share Demand') ;

insert into financial.line_item_type (name, description) 
	values('total.gross.revenue','Total Gross Faire Share Revenue') ;

insert into financial.line_item_type (name, description) 
	values('total.marginal.revenue','Total Marginal Faire Share Revenue') ;	


