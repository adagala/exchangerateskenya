import { TwitterApi } from 'twitter-api-v2';
import * as admin from 'firebase-admin';
import * as serviceAccount from '../exchangerateskenya-firebase-adminsdk.json';
import 'dotenv/config';
import { formatDate, formatTime } from '../utils';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

// in functions directory run:  ~ tsc && node lib/scripts/tweet.js
const tweet = async () => {
  console.log('Start post to twitter ...!');

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

  // Instantiate with desired auth type (here's Bearer v2 auth)
  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY as string,
    appSecret: process.env.TWITTER_APP_SECRET as string,
    accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
    accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
  });

  const displayDate = formatDate(new Date());
  const displayTime = formatTime(new Date());
  const tweetText = `Today's exchange rates against the Kenyan shilling (${displayDate} ${displayTime}): \n\nUSD ($): ${baseAsKenya.rates.USD}\nEUR (€): ${baseAsKenya.rates.EUR}\nGBP (£): ${baseAsKenya.rates.GBP}\nJPY (¥): ${baseAsKenya.rates.JPY}\n\n https://exchangerateskenya.web.app/`;
  await twitterClient.v2.tweet(tweetText);
  console.log(tweetText);
};

tweet()
  .then(() => console.log('Successfully posted to twitter'))
  .catch((err) => console.log('error :: ', err));
