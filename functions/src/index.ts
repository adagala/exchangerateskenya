import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { TwitterApi } from 'twitter-api-v2';
import * as admin from 'firebase-admin';
import { formatDate, formatTime } from './utils';

admin.initializeApp();

export const getRates = onRequest(
  { secrets: ['FIXER_API_KEY'], maxInstances: 5 },
  async (_request, response) => {
    const ratesReponse = await fetch(
      `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API_KEY}&symbols=KES,GBP,JPY,USD`,
    );
    const ratesResult = await ratesReponse.json();

    const formatCurrency = (value: number) =>
      (Math.round(value * 100) / 100).toFixed(2);
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
    schedule: '0 8-16/4 * * *',
    maxInstances: 5,
    secrets: [
      'FIXER_API_KEY',
      'TWITTER_APP_KEY',
      'TWITTER_APP_SECRET',
      'TWITTER_ACCESS_SECRET',
      'TWITTER_ACCESS_TOKEN',
    ],
    timeZone: 'Africa/Nairobi',
  },
  async () => {
    const ratesReponse = await fetch(
      `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API_KEY}&symbols=KES,GBP,JPY,USD`,
    );
    const ratesResult = await ratesReponse.json();

    const formatCurrency = (value: number) =>
      (Math.round(value * 100) / 100).toFixed(2);
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

    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY as string,
      appSecret: process.env.TWITTER_APP_SECRET as string,
      accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
      accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
    });
    const eastAfricanTime = new Date(new Date().getTime() + 3 * 60 * 60 * 1000);
    const displayDate = formatDate(eastAfricanTime);
    const displayTime = formatTime(eastAfricanTime);
    const tweetText = `Today's exchange rates against the Kenyan shilling (${displayDate} ${displayTime}): \n\nUSD ($): ${baseAsKenya.rates.USD}\nEUR (€): ${baseAsKenya.rates.EUR}\nGBP (£): ${baseAsKenya.rates.GBP}\nJPY (¥): ${baseAsKenya.rates.JPY}\n\n https://exchangerateskenya.web.app/`;
    await twitterClient.v2.tweet(tweetText);

    return;
  },
);
