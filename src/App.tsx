import { Title, AreaChart, Card, Select, SelectItem } from '@tremor/react';
import './App.css';
import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './utils/firebase';
import { ChartData, RateData } from './utils/types';
import { MultiSelect, MultiSelectItem } from '@tremor/react';
import { formatChartDate } from './utils/reusables';

const valueFormatter = function (number: number) {
  return new Intl.NumberFormat('us').format(number).toString();
};

const allColors = ['indigo', 'cyan', 'fuchsia', 'lime'];

function App() {
  const [chartdata, setChartdata] = useState<ChartData[]>([]);
  const [selectedValues, setSelectedValues] = useState(['USD']);
  const [colors, setColors] = useState<any>(['indigo']);
  const [days, setDays] = useState('10');

  const fetchRates = useCallback(async () => {
    const candidatesQuery = query(
      collection(db, 'rates'),
      orderBy('date', 'desc'),
      limit(Number(days)),
    );
    const unsubscribe = onSnapshot(candidatesQuery, async (querySnapshot) => {
      const rateData = querySnapshot.docs.map((doc) => doc.data() as RateData);
      const chartData = rateData.reverse().map((chart) => ({
        date: formatChartDate(chart.date),
        USD: chart.rates.USD,
        EUR: chart.rates.EUR,
        JPY: chart.rates.JPY,
        GBP: chart.rates.GBP,
      }));
      setChartdata(chartData);
    });
    return () => {
      unsubscribe();
    };
  }, [days]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return (
    <div className="my-4">
      <Title color="purple" className="text-2xl font-bold">
        Exchange Rates KE
      </Title>
      <div className="my-4 lg:flex lg:justify-end gap-1">
        <MultiSelect
          className="my-0.5 lg:w-1/3"
          value={selectedValues}
          onValueChange={(value) => {
            if (value.length < 1 && selectedValues.length === 1) return;
            if (value.length < 1 && selectedValues.length > 1) {
              setSelectedValues(['USD']);
              setColors(allColors.slice(0, 1));
              return;
            }
            setSelectedValues(value);
            setColors(allColors.slice(0, value.length));
          }}
        >
          <MultiSelectItem value="USD">USD</MultiSelectItem>
          <MultiSelectItem value="EUR">EUR</MultiSelectItem>
          <MultiSelectItem value="GBP">GBP</MultiSelectItem>
          <MultiSelectItem value="JPY">JPY</MultiSelectItem>
        </MultiSelect>
        <Select
          className="my-0.5 lg:w-1/12"
          value={days}
          onValueChange={setDays}
          enableClear={false}
        >
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="15">15</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="30">30</SelectItem>
        </Select>
      </div>
      <Card>
        <Title>Currencies against KES</Title>
        <AreaChart
          className="h-72 mt-4"
          data={chartdata}
          index="date"
          categories={selectedValues}
          colors={colors}
          valueFormatter={valueFormatter}
          autoMinValue={true}
        />
      </Card>
    </div>
  );
}

export default App;
