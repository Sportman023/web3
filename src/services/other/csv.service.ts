import Papa from 'papaparse';

export class CSVService {
  public prepareDocument(jsonArray: any[]) {
    if (jsonArray.length === 0) return '';
    const csv = Papa.unparse(jsonArray);

    return csv;
  }
}
