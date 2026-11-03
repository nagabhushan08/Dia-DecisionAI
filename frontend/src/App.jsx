
import { useState } from "react";
import GlucosePredictionChart from "./GlucosePredictionChart";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/predict";

const INITIAL_FORM = {
  glucose_value: "150",
  glucose_lag_1: "145",
  glucose_lag_2: "140",
  glucose_lag_3: "138",
  glucose_lag_6: "135",
  meal_carbs: "30",
  bolus_dose: "2",
  basal_value: "0.95",
  temp_basal_value: "0",
  exercise_duration: "0",
  exercise_intensity: "4",
  sleep_duration_hours: "7",
  sleep_quality: 4,
  finger_stick_value: "150",
};

const navItems = [
  ["⌂", "Overview"],
  ["⌁", "Glucose Trends"],
  // ["♧", "Digital Twin"],
  // ["♧", "AI Insights"],
  // ["◷", "History"],
  // ["⚙", "Settings"],
];

const n = (v) => (v === "" || v == null ? NaN : Number(v));

const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  const value = Number(v);
  return Number.isFinite(value) ? value.toFixed(1) : "—";
};

function getScenarios(result) {
  const raw = result?.scenarios ?? result?.scenario_predictions ?? [];

  if (Array.isArray(raw)) {
    return raw.map((x, i) => ({
      name: x.scenario ?? x.name ?? x.label ?? `Scenario ${i + 1}`,
      value:
        x.predicted_glucose ??
        x.predicted_glucose_30min ??
        x.prediction ??
        x.value,
    }));
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([name, x]) => ({
      name,
      value:
        typeof x === "object"
          ? x.predicted_glucose ?? x.prediction ?? x.value
          : x,
    }));
  }

  return [];
}

function listOf(x) {
  return Array.isArray(x)
    ? x
    : typeof x === "string" && x.trim()
      ? [x]
      : [];
}

export default function App() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) =>
    setForm((old) => ({ ...old, [key]: value }));

  function validate() {
    const fields = [
      ["glucose_value", "Current glucose"],
      ["glucose_lag_1", "Glucose 5 min ago"],
      ["glucose_lag_2", "Glucose 10 min ago"],
      ["glucose_lag_3", "Glucose 15 min ago"],
      ["glucose_lag_6", "Glucose 30 min ago"],
      ["meal_carbs", "Meal carbohydrates"],
      ["bolus_dose", "Bolus insulin"],
      ["basal_value", "Basal insulin"],
      ["temp_basal_value", "Temporary basal"],
      ["exercise_duration", "Exercise duration"],
      ["exercise_intensity", "Exercise intensity"],
      ["sleep_duration_hours", "Sleep duration"],
      ["finger_stick_value", "Finger-stick glucose"],
    ];

    for (const [key, label] of fields) {
      if (!Number.isFinite(n(form[key])) || n(form[key]) < 0) {
        return `${label} must be a valid, non-negative number.`;
      }
    }

    if (n(form.sleep_quality) < 1 || n(form.sleep_quality) > 5) {
      return "Sleep quality must be between 1 and 5.";
    }

    if (
      n(form.exercise_intensity) < 1 ||
      n(form.exercise_intensity) > 5
    ) {
      return "Exercise intensity must be between 1 and 5.";
    }

    if (
      n(form.sleep_duration_hours) < 1 ||
      n(form.sleep_duration_hours) > 12
    ) {
      return "Sleep duration must be between 1 and 12 hours.";
    }

    return "";
  }

  async function analyze(event) {
    event.preventDefault();

    const message = validate();

    if (message) {
      setError(message);
      return;
    }

    setLoading(true);
    setError("");

    const now = new Date();

    const payload = {
      glucose_value: n(form.glucose_value),
      glucose_lag_1: n(form.glucose_lag_1),
      glucose_lag_2: n(form.glucose_lag_2),
      glucose_lag_3: n(form.glucose_lag_3),
      glucose_lag_6: n(form.glucose_lag_6),

      glucose_change_5min:
        n(form.glucose_value) - n(form.glucose_lag_1),

      glucose_change_15min:
        n(form.glucose_value) - n(form.glucose_lag_3),

      meal_carbs: n(form.meal_carbs),
      bolus_dose: n(form.bolus_dose),
      basal_value: n(form.basal_value),
      temp_basal_value: n(form.temp_basal_value),
      exercise_duration: n(form.exercise_duration),
      exercise_intensity: n(form.exercise_intensity),
      sleep_duration_hours: n(form.sleep_duration_hours),
      sleep_quality: n(form.sleep_quality),
      finger_stick_value: n(form.finger_stick_value),
      hour: now.getHours(),
      day_of_week: now.getDay(),
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "The server returned an invalid response. Check your Flask endpoint."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Prediction request failed (${response.status}).`
        );
      }

      const nestedPrediction =
        data.prediction && typeof data.prediction === "object"
          ? data.prediction
          : {};

      const predictedValue =
        data.predicted_glucose_30min ??
        data.predicted_glucose ??
        data.predicted_value ??
        (typeof data.prediction === "number" ||
        typeof data.prediction === "string"
          ? data.prediction
          : undefined) ??
        nestedPrediction.predicted_glucose_30min ??
        nestedPrediction.predicted_glucose ??
        nestedPrediction.value;

      if (
        predictedValue === undefined ||
        predictedValue === null ||
        predictedValue === "" ||
        !Number.isFinite(Number(predictedValue))
      ) {
        console.error("Unexpected prediction API response:", data);

        throw new Error(
          "The API response did not include a numeric predicted glucose value. Check the Flask /predict response key: predicted_glucose_30min."
        );
      }

      setResult({
        ...data,
        predicted_glucose_30min: Number(predictedValue),
      });

      setPage("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        `${err.message || "Could not analyze this patient."} Confirm that Flask is running at ${API_URL}.`
      );
    } finally {
      setLoading(false);
    }
  }

  function newAnalysis() {
    setResult(null);
    setError("");
    setPage("input");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNew={newAnalysis} />

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-spacer" />

          <button className="notification" aria-label="Notifications">
            ♧<i />
          </button>

          <div className="user-menu">
            <span className="avatar">NR</span>
            <strong>Naagu</strong>
            <span className="chevron">⌄</span>
          </div>
        </header>

        {page === "input" ? (
          <InputPage
            form={form}
            update={update}
            onSubmit={analyze}
            loading={loading}
            error={error}
          />
        ) : (
          <ResultsPage
            result={result}
            form={form}
            onNew={newAnalysis}
          />
        )}

        <div className="wave-footer">
          <span>AI + Lifestyle = Better Decisions</span>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ page, onNew }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span>◉</span>
        </div>
        <div>
          <strong>DIA DECISION AI</strong>
          <small>Glucose Intelligence</small>
        </div>
      </div>

      <button
        className={`nav-item new-analysis ${
          page === "input" ? "active" : ""
        }`}
        onClick={onNew}
      >
        <span className="nav-symbol">＋</span>
        New Analysis
      </button>

      <nav>
        {navItems.map(([icon, label]) => (
          <button
            key={label}
            className="nav-item"
            onClick={label === "Overview" ? onNew : undefined}
          >
            <span className="nav-symbol">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-promo">
        <div className="lock-icon">♧</div>
        <p>
          Smarter decisions.
          <br />
          Healthier tomorrows.
        </p>
        <div className="promo-wave" />
      </div>
    </aside>
  );
}

function InputPage({ form, update, onSubmit, loading, error }) {
  return (
    <div className="page-wrap">
      <div className="page-heading">
        <div>
          <div className="crumb">
            <b>＋</b> New Analysis
          </div>

          <h1>
            <span />
            Patient Input
          </h1>

          <p>
            Enter the current health state to generate a 30-minute forecast
            <br className="desktop-break" /> and explore lifestyle scenarios
            using AI.
          </p>
        </div>

        <div className="steps">
          <div className="step current">
            <b>1</b>
            <span>Patient Input</span>
          </div>
          <i />
          <div className="step">
            <b>2</b>
            <span>Results</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-box" role="alert">
          <strong>Unable to analyze patient</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="input-layout">
        <form className="input-main" onSubmit={onSubmit}>
          <section className="form-card">
            <SectionHeading
              icon="drop"
              title="Glucose Profile"
              subtitle="Current reading and recent history"
            />

            <div className="field-grid three-cols">
              <Input
                label="Current Glucose"
                value={form.glucose_value}
                unit="mg/dL"
                onChange={(v) => update("glucose_value", v)}
              />

              <Input
                label="Glucose 5 min ago"
                value={form.glucose_lag_1}
                unit="mg/dL"
                onChange={(v) => update("glucose_lag_1", v)}
              />

              <Input
                label="Glucose 10 min ago"
                value={form.glucose_lag_2}
                unit="mg/dL"
                onChange={(v) => update("glucose_lag_2", v)}
              />

              <Input
                label="Glucose 15 min ago"
                value={form.glucose_lag_3}
                unit="mg/dL"
                onChange={(v) => update("glucose_lag_3", v)}
              />

              <Input
                label="Glucose 30 min ago"
                value={form.glucose_lag_6}
                unit="mg/dL"
                onChange={(v) => update("glucose_lag_6", v)}
              />

              <Input
                label="Finger-stick Glucose"
                value={form.finger_stick_value}
                unit="mg/dL"
                onChange={(v) => update("finger_stick_value", v)}
              />
            </div>
          </section>

          <section className="form-card">
            <SectionHeading
              icon="syringe"
              title="Insulin Profile"
              subtitle="Bolus, basal and temporary basal"
            />

            <div className="field-grid three-cols">
              <Input
                label="Bolus Insulin"
                value={form.bolus_dose}
                unit="units"
                onChange={(v) => update("bolus_dose", v)}
              />

              <Input
                label="Basal Insulin"
                value={form.basal_value}
                unit="units"
                onChange={(v) => update("basal_value", v)}
              />

              <Input
                label="Temp Basal (if any)"
                value={form.temp_basal_value}
                unit="units"
                onChange={(v) => update("temp_basal_value", v)}
              />
            </div>
          </section>

          <section className="form-card">
            <SectionHeading
              icon="food"
              title="Lifestyle Profile"
              subtitle="Meal, activity and sleep"
            />

            <div className="field-grid three-cols">
              <Input
                label="Meal Carbohydrates"
                value={form.meal_carbs}
                unit="grams"
                onChange={(v) => update("meal_carbs", v)}
              />

              <Input
                label="Exercise Duration"
                value={form.exercise_duration}
                unit="min"
                onChange={(v) => update("exercise_duration", v)}
              />

              <Input
                label="Exercise Intensity"
                value={form.exercise_intensity}
                unit="/ 5"
                min="1"
                max="5"
                onChange={(v) => update("exercise_intensity", v)}
              />

              <Input
                label="Sleep Duration"
                value={form.sleep_duration_hours}
                unit="hours"
                min="1"
                max="12"
                onChange={(v) => update("sleep_duration_hours", v)}
              />

              <Input
                label="Sleep Quality"
                value={form.sleep_quality}
                unit="/ 5"
                min="1"
                max="5"
                onChange={(v) => update("sleep_quality", v)}
              />
            </div>
          </section>

          <div className="pro-tip">
            <span>♧</span>
            <div>
              <strong>Pro Tip</strong>
              <p>
                Make sure all values are accurate for better predictions.
                The model uses 18 features for analysis.
              </p>
            </div>
          </div>
        </form>

        <aside className="input-aside">
          <section className="aside-card right-card">
            <GlucoseIllustration />

            <h2>What happens next?</h2>

            <div className="next-list">
              <NextStep
                number="✓"
                done
                title="Your input will be validated"
              />
              <NextStep
                number="2"
                title="AI model will predict your glucose"
              />
              <NextStep
                number="3"
                title="4 lifestyle scenarios will be simulated"
              />
              <NextStep
                number="4"
                title="You'll get the best recommendation"
              />
            </div>

            <div className="privacy-note">
              <span className="shield">♢</span>
              <div>
                <strong>Your privacy matters</strong>
                <p>
                  All data is processed securely and used only for this
                  analysis.
                </p>
              </div>
            </div>

            <button
              className="analyze-button"
              type="button"
              onClick={() =>
                document.querySelector(".input-main")?.requestSubmit()
              }
              disabled={loading}
            >
              {loading ? (
                "Analyzing patient…"
              ) : (
                <>
                  <span>✣</span> Analyze Patient <b>→</b>
                </>
              )}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SectionHeading({ icon, title, subtitle }) {
  const icons = {
    drop: "♢",
    syringe: "⚒",
    food: "♜",
    clipboard: "▣",
  };

  return (
    <div className="section-heading">
      <div className={`section-icon ${icon}`}>{icons[icon]}</div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function Input({ label, value, unit, onChange, min = "0", max }) {
  return (
    <label className="input-field">
      <span>{label}</span>

      <div className="input-container">
        <input
          type="number"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <small>{unit}</small>
      </div>
    </label>
  );
}

function NextStep({ number, title, done }) {
  return (
    <div className="next-item">
      <span className={done ? "done" : ""}>{number}</span>
      <p>{title}</p>
    </div>
  );
}

function GlucoseIllustration() {
  return (
    <div className="glucose-illustration">
      <div className="meter">
        <div className="meter-screen">
          <strong>150</strong>
          <small>mg/dL</small>
          <i />
          <i />
          <i />
        </div>
      </div>

      <svg
        viewBox="0 0 240 100"
        aria-label="Illustrative glucose trend"
      >
        <path
          d="M0 65 C18 43 23 85 42 64 S62 30 79 55 S105 77 122 50 S142 74 161 42 S181 20 195 41 S218 69 240 45"
          fill="none"
          stroke="#68c5ed"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M0 74 C20 65 28 87 46 70 S71 51 87 69 S110 88 128 62 S148 75 166 55 S185 26 200 45 S220 69 240 55"
          fill="none"
          stroke="#4789ff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="184" cy="27" r="4" fill="#a3e9d8" />
      </svg>
    </div>
  );
}

function ResultsPage({ result, form, onNew }) {
  const scenarios = getScenarios(result);

  const current =
    result?.current_glucose ??
    result?.glucose_value ??
    form.glucose_value;

  const predicted =
    result?.predicted_glucose_30min ??
    result?.predicted_glucose ??
    result?.prediction ??
    result?.predicted_value;

  const best = result?.best_scenario ?? "Current lifestyle";

  const observations = listOf(result?.observations);
  const recommendations = listOf(result?.recommendations);

  // The chart receives the exact submitted form values and the
  // normalized prediction returned by the Flask API.
  const chartResult = {
    ...result,
    current_glucose: current,
    predicted_glucose_30min: predicted,
  };

  return (
    <div className="page-wrap results-page">
      <div className="page-heading">
        <div>
          <div className="crumb">＋ New Analysis</div>

          <h1>
            <span />
            Analysis Results
          </h1>

          <p>
            Review the 30-minute glucose forecast and simulated lifestyle
            scenarios.
          </p>
        </div>

        <button className="secondary-button" onClick={onNew}>
          ← New Analysis
        </button>
      </div>

      <div className="result-summary">
        <div>
          <small>Current glucose</small>
          <strong>{fmt(current)}</strong>
          <span>mg/dL</span>
        </div>

        <b>→</b>

        <div>
          <small>Predicted glucose</small>
          <strong>{fmt(predicted)}</strong>
          <span>mg/dL · 30-minute estimate</span>
        </div>

        <div className="status">
          <small>Glucose status</small>
          <strong>
            {result?.glucose_status ??
              result?.status ??
              "Prediction ready"}
          </strong>
        </div>
      </div>

      {/* NEW: Glucose prediction chart */}
      <GlucosePredictionChart
        inputs={form}
        result={chartResult}
      />

      <section className="form-card results-card">
        <SectionHeading
          icon="drop"
          title="Four-state comparison"
          subtitle="Compare model predictions returned for each scenario"
        />

        {scenarios.length ? (
          <div className="scenario-grid">
            {scenarios.map((s, i) => (
              <article key={`${s.name}-${i}`}>
                <h3>{s.name}</h3>
                <strong>
                  {fmt(s.value)} <small>mg/dL</small>
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <p>No scenario data was returned by the Flask endpoint.</p>
        )}
      </section>

      <div className="results-columns">
        <section className="form-card">
          <h2>{best}</h2>
          <p>
            {result?.decision ??
              "Review model estimates with your care team."}
          </p>
          <strong>
            Simulated change: {fmt(result?.simulated_improvement ?? 0)} mg/dL
          </strong>
        </section>

        <section className="form-card">
          <h2>Observations & recommendations</h2>

          <h3>Observations</h3>

          {observations.length ? (
            <ul>
              {observations.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <p>No observations returned.</p>
          )}

          <h3>Recommendations</h3>

          {recommendations.length ? (
            <ul>
              {recommendations.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <p>No recommendations returned.</p>
          )}
        </section>
      </div>

      <p className="medical-note">
        Decision-support demonstration only. Predictions are estimates,
        not medical advice. Do not change insulin doses based on this page.
      </p>

      <button className="analyze-button" onClick={onNew}>
        Start another analysis →
      </button>
    </div>
  );
}
