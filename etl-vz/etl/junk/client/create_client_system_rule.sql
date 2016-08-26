DROP TABLE IF EXISTS client.system_rule;
CREATE TABLE client.system_rule (
	"id" serial PRIMARY KEY,
	 name varchar(64) UNIQUE,
	description varchar(256)
) ;

INSERT INTO client.system_rule
	(name, description)
VALUES
	('system_defaults', 'System Defaults') ; 
