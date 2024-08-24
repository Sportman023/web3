export class TelegramClient {
  private readonly baseUrl: string;

  constructor() {
    const token = String(process.env.TELEGRAM_TOKEN);
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(chatId: string, message: string) {
    const url = `${this.baseUrl}/sendMessage?chat_id=${chatId}&text=${message}`;

    try {
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        console.log('❌ error', response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ error:', error);
      return null;
    }
  }

  async sendDocument(chatId: string, csv: string) {
    const url = `${this.baseUrl}/sendDocument`;
    const formData = new FormData();
    const contentType = 'text/csv';
    const csvFile = new Blob([csv], { type: contentType });

    formData.append('chat_id', chatId);
    formData.append('document', csvFile, `arbitration_report_${new Date().toISOString()}.csv`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.log('❌ error', response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ error:', error);
      return null;
    }
  }
}