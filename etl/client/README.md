# Spend data

## Background
The relevant data is in cells C219:W434 of the Total Spend by Size sheet within the 2014 07 09 Spend Matrix Germany.xlsx file. This data represents the yearly spend per business. 

Importing the spend data from this Excel workbook will require some manipulation of the data in Excel. 

### Creating a spend dataset
Importing the spend data from this Excel workbook will require some manipulation of the data in Excel. The data required for the import process is a csv file with the following columns: 
- industry_name	
- employees_at_location_range	
- product_type	
- product	
- year	
- currency	
- spend

Spend should be the spend per business for the entire calendar year. The ETL script will divide this value by 12 to get a monthly spend value. You do not need to do this before importing the data.

Steps to convert: 

	1. Create a new column called “year” and a column called “spend”. Duplicate the metadata for each spend year and copy/paste the spend values.
	2. Rename the column “Spending category” to “product_type”.
	3. Rename the column “Subcategory” to “product”.
	4. Rename the column “Company size” to “employees_at_location_range”.
	4. Rename the “Industry” column to “industry_name”.
	5. Rename the “Unit” column to “currency”.
	6. Ensure that the “currency” column has a 3-letter abbreviation for the currency depicted in the data.
	7. Remove the “Category” column.
	8. Save the resulting file with the name `reformatted_spend.csv`.
	9. Place the `reformatted_spend.csv` file in the `etl/client` directory.

#### ETL

 - `make reset_client`: Drops all client-related objects.
 - `make etl_client`: One of the commands executed with this command is the reload of all data stored in the `reformatted_spend.csv` file. 

