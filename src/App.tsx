import React, { useState, useCallback, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, ZAxis } from 'recharts';
import { Button, Slider, Card, CardContent, CardHeader, Typography } from '@mui/material';

const generateNonUniformData = (count = 50) => {
  const baseData = [];

  // Generate non-uniform data
  for (let i = 0; i < count; i++) {
    let value;
    const rand = Math.random();
    if (rand < 0.6) {
      // 60% chance of being in the "normal" range
      value = Math.floor(Math.random() * 60) + 20; // 20-79
    } else if (rand < 0.8) {
      // 20% chance of being a low value
      value = Math.floor(Math.random() * 20); // 0-19
    } else {
      // 20% chance of being a high value
      value = Math.floor(Math.random() * 100) + 80; // 80-179
    }
    baseData.push({ value });
  }

  // Add a few extreme outliers
  baseData.push({ value: Math.floor(Math.random() * 50) + 180 }); // 180-229
  baseData.push({ value: Math.floor(Math.random() * 70) + 230 }); // 230-299

  // Shuffle the array
  for (let i = baseData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baseData[i], baseData[j]] = [baseData[j], baseData[i]];
  }

  // Add index
  return baseData.map((item, index) => ({ ...item, index }));
};

const calculatePercentile = (data, percentile) => {
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
};

const calculateAverage = (data) => {
  const sum = data.reduce((acc, item) => acc + item.value, 0);
  return sum / data.length;
};

const PercentileComparison = () => {
  const [data, setData] = useState(generateNonUniformData());
  const [percentile, setPercentile] = useState(90);
  const [isSorted, setIsSorted] = useState(false);

  const regenerateData = useCallback(() => {
    setData(generateNonUniformData());
    setIsSorted(false);
  }, []);

  const sortData = useCallback(() => {
    const sortedData = [...data].sort((a, b) => a.value - b.value);
    setData(sortedData.map((item, index) => ({ ...item, index })));
    setIsSorted(true);
  }, [data]);

  const p50 = useMemo(() => calculatePercentile(data, 50), [data]);
  const pCustom = useMemo(() => calculatePercentile(data, percentile), [data, percentile]);
  const average = useMemo(() => calculateAverage(data), [data]);

  const highlightedData = useMemo(() => 
    data.map(item => ({
      ...item,
      z: item.index === pCustom.index ? 100 : 50,
      opacity: item.index === pCustom.index ? 1 : 0.5
    })),
  [data, pCustom]);

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <CardHeader title="Percentile and Average Comparison (Non-Uniform Distribution)" />
      <CardContent>
        <ScatterChart width={600} height={300} margin={{ top: 20, right: 80, bottom: 20, left: 20 }}>
          <XAxis dataKey="index" name="Index" />
          <YAxis dataKey="value" name="Value" />
          <ZAxis dataKey="z" range={[20, 100]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={highlightedData} fill="#8884d8" />
          <ReferenceLine y={p50.value} label={{ value: "P50", position: 'right' }} stroke="green" />
          <ReferenceLine y={pCustom.value} label={{ value: `P${percentile}`, position: 'right' }} stroke="blue" />
          <ReferenceLine y={average} label={{ value: "Average", position: 'right' }} stroke="red" />
        </ScatterChart>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <Button variant="contained" onClick={regenerateData}>Randomize Data</Button>
          <Button variant="contained" onClick={sortData} disabled={isSorted}>Sort Values</Button>
        </div>

        <div style={{ marginTop: '16px' }}>
          <Typography variant="body1">Custom Percentile: <Typography variant="h6">{percentile}</Typography></Typography>
          <Slider
            value={percentile}
            min={1}
            max={99}
            step={1}
            onChange={(event, newValue) => setPercentile(newValue)}
            valueLabelDisplay="auto"
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Typography variant="body1">P50 (Median): {p50.value.toFixed(2)}</Typography>
          <Typography variant="body1">P{percentile}: {pCustom.value.toFixed(2)}</Typography>
          <Typography variant="body1">Average: {average.toFixed(2)}</Typography>
        </div>
      </CardContent>
    </Card>
  );
};

export default PercentileComparison;