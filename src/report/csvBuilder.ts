export class CSVBuilder {

  public prepareDocument(jsonArray: any[]) {
    if (jsonArray.length === 0) return '';

    const allPairs = new Set();
    const exchanges = new Set();
    let csv = '';

    jsonArray.forEach(item => {
      Object.keys(item.pairs).forEach(exchange => {
        exchanges.add(exchange);
        Object.keys(item.pairs[exchange]).forEach(pair => allPairs.add(pair));
      });
    });

    const headers = ['Time', ...Array.from(allPairs).flatMap(pair =>
      Array.from(exchanges).map(exchange => `${exchange} ${pair}`)
    ), 'MAX_SHIFT (USDT)'];
    csv += `${headers.join(',')}\r\n`;

    jsonArray.forEach(item => {
      const currentTime = new Date().toISOString();
      const values = [currentTime];

      allPairs.forEach((pair: any) => {
        Array.from(exchanges).forEach((exchange: any) => {
          const value = item.pairs[exchange]?.[pair];
          values.push(value !== undefined ? value.toFixed(8) : '');
        });
      });

      values.push(item.maxShift.toFixed(8));

      csv += `${values.join(',')}\r\n`;
    });

    return csv;
  }
}