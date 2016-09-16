DROP TABLE IF EXISTS client.businesses_sizes;
CREATE TABLE client.businesses_sizes
(
  size_name character varying primary key,
  min_value integer,
  max_value integer
 );

 insert into client.businesses_sizes values
 ('XS', 0, 1),
 ('S', 2, 24),
 ('M', 25, 49),
 ('L', 50, 99),
 ('XL', 100, 100000000);
