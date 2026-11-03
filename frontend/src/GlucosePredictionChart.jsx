
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

import "./GlucosePredictionChart.css";

export default function GlucosePredictionChart({
  inputs,
  result,
  onNewAnalysis,
  onViewResults,
}) {
  if (!inputs || !result) return null;

  const current = Number(
    result.current_glucose ?? inputs.glucose_value
  );

  const predicted = Number(result.predicted_glucose_30min);

  if (!Number.isFinite(current) || !Number.isFinite(predicted)) {
    return null;
  }

  // Use the real historical values supplied to the model.
  // Lag numbers do not necessarily represent exact time intervals.
  const historicalInputs = [
    { label: "Lag 6", value: inputs.glucose_lag_6 },
    { label: "Lag 3", value: inputs.glucose_lag_3 },
    { label: "Lag 2", value: inputs.glucose_lag_2 },
    { label: "Lag 1", value: inputs.glucose_lag_1 },
  ];

  const history = historicalInputs
    .filter(
      (item) =>
        item.value !== "" &&
        item.value !== null &&
        item.value !== undefined &&
        Number.isFinite(Number(item.value))
    )
    .map((item) => ({
      time: item.label,
      actual: Number(item.value),
      forecast: null,
      kind: "history",
    }));

  // Both lines meet at the actual current reading.
  const chartData = [
    ...history,
    {
      time: "Now",
      actual: current,
      forecast: current,
      kind: "current",
    },
    {
      time: "+30 min",
      actual: null,
      forecast: predicted,
      kind: "prediction",
    },
  ];

  const change = predicted - current;

  // Informational display only, not a personalized clinical assessment.
  const status =
    predicted < 70
      ? "Below 70"
      : predicted <= 180
        ? "70–180"
        : "Above 180";

  const statusClass =
    predicted < 70
      ? "gtr-status-low"
      : predicted <= 180
        ? "gtr-status-range"
        : "gtr-status-high";

  const readings = [
    ...history.map((point) => ({
      label: `Historical input · ${point.time}`,
      value: point.actual,
      type: "history",
    })),
    {
      label: "Current reading",
      value: current,
      type: "current",
    },
    {
      label: "Predicted in 30 minutes",
      value: predicted,
      type: "prediction",
    },
  ];

  return (
    <main className="gtr-page">
      {/* Page heading */}
      <header className="gtr-page-header">
        <div>
          <div className="gtr-eyebrow">
            <span className="gtr-eyebrow-dot" />
            GLUCOSE MONITORING
          </div>

          <h1>Glucose Trends</h1>

          <p>
            Review entered glucose history and compare it with
            the model&apos;s 30-minute forecast.
          </p>
        </div>

        <div className="gtr-brand">
          <span className="gtr-brand-mark">D</span>
          <span>
            <strong>DIA</strong>
            <small>Decision AI</small>
          </span>
        </div>
      </header>

      {/* Summary cards */}
      <section className="gtr-summary" aria-label="Glucose summary">
        <article className="gtr-stat-card">
          <div className="gtr-stat-top">
            <span className="gtr-stat-label">CURRENT READING</span>
            <span className="gtr-stat-icon gtr-icon-blue">↗</span>
          </div>

          <div className="gtr-stat-value">
            {current.toFixed(1)}
            <span>mg/dL</span>
          </div>

          <p className="gtr-stat-caption">
            Most recent entered glucose
          </p>
        </article>

        <article className="gtr-stat-card gtr-stat-forecast">
          <div className="gtr-stat-top">
            <span className="gtr-stat-label">30-MIN FORECAST</span>
            <span className="gtr-stat-icon gtr-icon-green">⌁</span>
          </div>

          <div className="gtr-stat-value">
            {predicted.toFixed(1)}
            <span>mg/dL</span>
          </div>

          <p className="gtr-stat-caption">
            {change > 0 ? "+" : ""}
            {change.toFixed(1)} mg/dL from current
          </p>
        </article>

        <article className="gtr-stat-card">
          <div className="gtr-stat-top">
            <span className="gtr-stat-label">FORECAST STATUS</span>
            <span className={`gtr-status-pill ${statusClass}`}>
              <span />
              {predicted < 70
                ? "Below range"
                : predicted <= 180
                  ? "In range"
                  : "Above range"}
            </span>
          </div>

          <div className="gtr-status-value">{status}</div>

          <p className="gtr-stat-caption">
            mg/dL · Informational threshold
          </p>
        </article>
      </section>

      {/* Main chart */}
      <section className="gtr-panel gtr-chart-panel">
        <div className="gtr-panel-header">
          <div>
            <h2>Glucose history and forecast</h2>
            <p>
              Historical inputs are blue; the 30-minute forecast is green.
            </p>
          </div>

          <div className="gtr-legend">
            <span>
              <i className="gtr-legend-line gtr-legend-history" />
              History
            </span>

            <span>
              <i className="gtr-legend-line gtr-legend-forecast" />
              Forecast
            </span>
          </div>
        </div>

        <div className="gtr-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 24,
                right: 22,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                stroke="#E8EEF5"
                strokeDasharray="3 5"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tick={{
                  fill: "#77869A",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                interval={0}
              />

              <YAxis
                domain={([min, max]) => {
                  const padding = Math.max(
                    10,
                    (max - min) * 0.18
                  );

                  return [
                    Math.max(0, Math.floor(min - padding)),
                    Math.ceil(max + padding),
                  ];
                }}
                tick={{
                  fill: "#77869A",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                width={58}
                label={{
                  value: "Glucose (mg/dL)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#77869A",
                  fontSize: 11,
                }}
              />

              <Tooltip
                contentStyle={{
                  border: "1px solid #E1E8F0",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(30, 55, 90, 0.08)",
                  padding: "10px 13px",
                }}
                labelStyle={{
                  color: "#24364B",
                  fontWeight: 700,
                  marginBottom: 5,
                }}
                formatter={(value, name) => [
                  `${Number(value).toFixed(1)} mg/dL`,
                  name === "actual"
                    ? "Historical glucose"
                    : "Predicted glucose",
                ]}
              />

              <ReferenceLine
                x="Now"
                stroke="#AAB7C7"
                strokeDasharray="4 5"
                label={{
                  value: "NOW",
                  position: "insideTop",
                  fill: "#718096",
                  fontSize: 10,
                }}
              />

              <Line
                type="monotone"
                dataKey="actual"
                name="actual"
                stroke="#3478D4"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#3478D4",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />

              <Line
                type="linear"
                dataKey="forecast"
                name="forecast"
                stroke="#159957"
                strokeWidth={3}
                strokeDasharray="7 6"
                dot={{
                  r: 5,
                  fill: "#159957",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 7,
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="gtr-chart-note">
          <span className="gtr-note-icon">i</span>
          <p>
            The dashed line connects the current reading to the model&apos;s
            predicted value. It does not represent intermediate predictions.
          </p>
        </div>
      </section>

      {/* Reading details */}
      <section className="gtr-panel gtr-readings-panel">
        <div className="gtr-panel-header">
          <div>
            <h2>Readings used in this chart</h2>
            <p>
              Values supplied to the current analysis and its forecast.
            </p>
          </div>

          <span className="gtr-count">
            {readings.length} readings
          </span>
        </div>

        <div className="gtr-reading-list">
          {readings.map((reading, index) => (
            <div
              className={`gtr-reading-row gtr-reading-${reading.type}`}
              key={`${reading.type}-${index}`}
            >
              <span className="gtr-reading-marker" />

              <span className="gtr-reading-label">
                {reading.label}
              </span>

              <strong>
                {reading.value.toFixed(1)}
                <span> mg/dL</span>
              </strong>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation actions */}
      {(onNewAnalysis || onViewResults) && (
        <div className="gtr-actions">
          {onNewAnalysis && (
            <button
              type="button"
              className="gtr-button gtr-button-secondary"
              onClick={onNewAnalysis}
            >
              <span>＋</span>
              New analysis
            </button>
          )}

          {onViewResults && (
            <button
              type="button"
              className="gtr-button gtr-button-primary"
              onClick={onViewResults}
            >
              View results
              <span>→</span>
            </button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <footer className="gtr-disclaimer">
        <span className="gtr-disclaimer-icon">i</span>
        <p>
          Historical values are taken from the submitted form. They are
          not automatically fetched from a continuous glucose monitor or
          database. Forecast status uses a simple display threshold and
          is not a personalized clinical assessment. This tool supports
          demonstration and decision support, not medical diagnosis or
          treatment decisions.
        </p>
      </footer>

      <div className="gtr-footer-brand">
        Dia Decision AI
        <span>·</span>
        Glucose prediction and lifestyle decision support
      </div>
    </main>
  );
}
