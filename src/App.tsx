import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ZAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Button,
  Slider,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Link,
  Box,
} from "@mui/material";

interface DataPoint {
  value: number;
  index: number;
}

interface HighlightedDataPoint extends DataPoint {
  z: number;
  opacity: number;
  isYourScore?: boolean;
}

const generateNonUniformData = (count = 30): DataPoint[] => {
  const baseData: DataPoint[] = [];

  // Helper function to generate normally distributed random numbers
  const normalRandom = (mean: number, stdDev: number): number => {
    const u1 = Math.random();
    const u2 = Math.random();
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    return mean + stdDev * randStdNormal;
  };

  // Generate normally distributed scores centered around 225 points (75% of 300)
  for (let i = 0; i < count; i++) {
    let value;
    // Mean of 225, standard deviation of 30
    value = normalRandom(225, 30);
    
    // Clamp values between 0 and 300
    value = Math.min(300, Math.max(0, Math.round(value)));
    
    baseData.push({ value, index: 0 });
  }

  // Add a few strategic points to ensure interesting distribution
  // Add one or two high performers
  baseData.push({ value: Math.floor(Math.random() * 15) + 285, index: 0 }); // 285-299
  if (Math.random() > 0.5) {
    baseData.push({ value: 300, index: 0 }); // Perfect score occasionally
  }

  // Add one or two struggling students
  baseData.push({ value: Math.floor(Math.random() * 45) + 135, index: 0 }); // 135-179
  if (Math.random() > 0.7) {
    baseData.push({ value: Math.floor(Math.random() * 30) + 105, index: 0 }); // 105-134
  }

  // Shuffle the array
  for (let i = baseData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baseData[i], baseData[j]] = [baseData[j], baseData[i]];
  }

  // Add index
  return baseData.map((item, index) => ({ ...item, index }));
};

const calculatePercentile = (
  data: DataPoint[],
  percentile: number,
): DataPoint => {
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
};

const calculateAverage = (data: DataPoint[]): number => {
  const sum = data.reduce((acc, item) => acc + item.value, 0);
  return sum / data.length;
};

const PercentileComparison: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>(generateNonUniformData());
  const [selectedScore, setSelectedScore] = useState<number>(270);
  const [isSorted, setIsSorted] = useState<boolean>(false);

  // Get sorted unique scores from data
  const availableScores = useMemo(() => {
    const uniqueScores = Array.from(new Set(data.map(point => point.value)));
    return uniqueScores.sort((a, b) => a - b);
  }, [data]);

  // Find the closest available score
  const findClosestScore = useCallback((target: number) => {
    return availableScores.reduce((prev, curr) => {
      return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
    });
  }, [availableScores]);

  // Initialize with closest available score to 270
  useEffect(() => {
    setSelectedScore(findClosestScore(270));
  }, [data, findClosestScore]);

  const regenerateData = useCallback(() => {
    setData(generateNonUniformData());
    setIsSorted(false);
  }, []);

  const sortData = useCallback(() => {
    const sortedData = [...data].sort((a, b) => a.value - b.value);
    setData(sortedData.map((item, index) => ({ ...item, index })));
    setIsSorted(true);
  }, [data]);

  const calculatePercentileForScore = useCallback((score: number): number => {
    const belowCount = data.filter(point => point.value <= score).length;
    return Math.round((belowCount / data.length) * 100);
  }, [data]);

  const p50 = useMemo(() => calculatePercentile(data, 50), [data]);
  const average = useMemo(() => calculateAverage(data), [data]);
  const percentile = useMemo(() => calculatePercentileForScore(selectedScore), [selectedScore, calculatePercentileForScore]);

  const handleScoreChange = (newValue: number) => {
    const closestScore = findClosestScore(newValue);
    setSelectedScore(closestScore);
  };

  const highlightedData = useMemo<HighlightedDataPoint[]>(
    () =>
      data.map((item) => ({
        ...item,
        z: item.value === selectedScore ? 100 : 50,
        opacity: item.value === selectedScore ? 1 : 0.5,
        isYourScore: item.value === selectedScore,
      })),
    [data, selectedScore],
  );

  return (
    <Card
      sx={{ maxWidth: { xs: "100%", sm: 600 }, margin: "auto", mt: 4, px: 2 }}
    >
      <CardHeader 
        title="Percentiles Explained"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 120, bottom: 20, left: 60 }}>
            <XAxis dataKey="index" name="Student" label={{ value: "Student Number", position: "bottom" }} />
            <YAxis 
              dataKey="value" 
              name="Score" 
              label={{ value: "Exam Score", angle: -90, position: "insideLeft", offset: -50 }}
              domain={[0, 100]} 
            />
            <ZAxis dataKey="z" range={[20, 100]} />
            <Tooltip 
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: any, name: string, props: any) => {
                const point = props.payload;
                const label = point.isYourScore ? "Your Score" : "Classmate's Score";
                return [`${value}%`, label];
              }}
            />
            <Scatter 
              data={highlightedData} 
              fill="#8884d8"
              shape={(props: any) => {
                const { cx, cy, fill } = props;
                const point = props.payload;
                return point.isYourScore ? (
                  <path
                    d={`M ${cx-8},${cy} L ${cx},${cy-8} L ${cx+8},${cy} L ${cx},${cy+8} Z`}
                    fill="#ff5722"
                    stroke="#ff5722"
                  />
                ) : (
                  <circle cx={cx} cy={cy} r={4} fill={fill} />
                );
              }}
            />
            <ReferenceLine
              y={p50.value}
              stroke="green"
            />
            <ReferenceLine
              y={selectedScore}
              stroke="#ff5722"
              strokeWidth={2}
            />
            <ReferenceLine
              y={average}
              stroke="red"
            />
          </ScatterChart>
        </ResponsiveContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: '#ff5722' }} />
            <Typography variant="body2">Your Score ({selectedScore.toFixed(0)})</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: 'green' }} />
            <Typography variant="body2">Class Median ({p50.value.toFixed(0)})</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: 'red' }} />
            <Typography variant="body2">Class Average ({average.toFixed(0)})</Typography>
          </Box>
        </Box>

        <Box sx={{ marginTop: "16px", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: "8px" }}>
          <Button variant="contained" onClick={regenerateData} fullWidth>
            Generate New Class Data
          </Button>
          <Button variant="contained" onClick={sortData} disabled={isSorted} fullWidth>
            Sort by Score
          </Button>
        </Box>

        <Box sx={{ marginTop: "16px" }}>
          <Typography variant="body1" paragraph>
            With a score of {selectedScore.toFixed(0)}, you performed better than {percentile}% of your classmates. 
            Only {100 - percentile}% of students scored higher than you.
          </Typography>
          <Typography variant="body1" paragraph>
            {selectedScore > average 
              ? `You scored ${Math.abs(selectedScore - average).toFixed(0)} points above the class average.`
              : `You scored ${Math.abs(average - selectedScore).toFixed(0)} points below the class average.`}
          </Typography>
          
          <Typography variant="caption" sx={{ mt: 2 }}>
            Move the slider to explore different scores:
          </Typography>
          <Box sx={{ px: 3, py: 2 }}>
            <Slider
              value={selectedScore}
              min={availableScores[0]}
              max={availableScores[availableScores.length - 1]}
              step={null}
              marks={availableScores.map(score => ({ value: score }))}
              onChange={(_, newValue) => handleScoreChange(Number(newValue))}
              valueLabelDisplay="auto"
              aria-label="Score selector"
              sx={{ 
                '& .MuiSlider-markLabel': {
                  display: 'none'
                }
              }}
            />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Score: {selectedScore}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            This score puts you in the {percentile}th percentile
          </Typography>
        </Box>
        <Box id="footer" sx={{ marginTop: "24px" }}>
          <Typography variant="body2" align="center">
            Made by Igor at{" "}
            <Link
              href="https://igorstechnoclub.com/90th-percentile-meaning/"
              target="_blank"
              rel="noopener"
            >
              Igor's Techno Club
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PercentileComparison;

