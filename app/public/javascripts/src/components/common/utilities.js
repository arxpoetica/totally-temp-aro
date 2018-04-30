class Utilities {
  constructor($document){
    this.document = $document[0]
  }


  downloadCSV(data, fileName){
    let csvContent = "data:text/csv;charset=utf-8," + data.toString();
    let a = this.document.createElement('a');
    a.href = csvContent
    a.setAttribute('download', fileName);
    this.document.body.appendChild(a);
    a.click();
    this.document.body.removeChild(a);
  }
}

Utilities.$inject =['$document'];

export default Utilities