import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const getRates = onRequest(
  { secrets: ['FIXER_API_KEY'], maxInstances: 5 },
  async (_request, response) => {
    const ratesReponse = await fetch(
      `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API_KEY}&symbols=KES,GBP,JPY,USD`,
    );
    const ratesResult = await ratesReponse.json();

    const formatCurrency = (value: number) => parseFloat(value.toFixed(2));
    const baseAsKenya = {
      timestamp: ratesResult.timestamp,
      date: ratesResult.date,
      rates: {
        EUR: formatCurrency(ratesResult.rates.KES),
        GBP: formatCurrency(ratesResult.rates.KES / ratesResult.rates.GBP),
        JPY: formatCurrency(ratesResult.rates.KES / ratesResult.rates.JPY),
        USD: formatCurrency(ratesResult.rates.KES / ratesResult.rates.USD),
      },
    };

    await admin.firestore().doc(`rates/${baseAsKenya.date}`).set(baseAsKenya);
    response.send(baseAsKenya);
  },
);

export const getDailyRates = onSchedule(
  {
    schedule: '0 9 * * *',
    maxInstances: 5,
    secrets: ['FIXER_API_KEY'],
    timeZone: 'Africa/Nairobi',
  },
  async () => {
    const ratesReponse = await fetch(
      `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API_KEY}&symbols=KES,GBP,JPY,USD`,
    );
    const ratesResult = await ratesReponse.json();

    const formatCurrency = (value: number) => parseFloat(value.toFixed(2));
    const baseAsKenya = {
      timestamp: ratesResult.timestamp,
      date: ratesResult.date,
      rates: {
        EUR: formatCurrency(ratesResult.rates.KES),
        GBP: formatCurrency(ratesResult.rates.KES / ratesResult.rates.GBP),
        JPY: formatCurrency(ratesResult.rates.KES / ratesResult.rates.JPY),
        USD: formatCurrency(ratesResult.rates.KES / ratesResult.rates.USD),
      },
    };

    await admin.firestore().doc(`rates/${baseAsKenya.date}`).set(baseAsKenya);
    return;
  },
);
