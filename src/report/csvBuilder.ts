export class CSVBuilder {
    public prepareDocument(jsonArray: any[]) {
        if (jsonArray.length === 0) return '';
        let csv = '';

        const headers = ['Provider', 'Pair', 'Price', 'Time'];
        csv += `${headers.join(',')}\r\n`;

        jsonArray.forEach((item) => {
            const currentTime = item.currentTime;

            item.results.forEach((result: any) => {
                const values: any = [];
                values.push(result.provider);
                values.push(result.pair);
                values.push(result.price);
                values.push(currentTime);
                csv += `${values.join(',')}\r\n`;
            });
        });

        return csv;
    }
}
