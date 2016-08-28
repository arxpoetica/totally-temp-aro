-- Table: aro.algorithms

DROP TABLE IF EXISTS aro.algorithms;

CREATE TABLE aro.algorithms (
	id character varying PRIMARY KEY,
	name character varying NOT NULL,
	description character varying NOT NULL
);

INSERT INTO aro.algorithms (id, name, description) VALUES
('fttp', 'FTTP', 'Fiber to the Point'),
('fttt', 'FTTT', 'Fiber to the Tower');
