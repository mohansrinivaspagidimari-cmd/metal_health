import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import "./style.css";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

const algorithms = ["Logistic Regression", "Random Forest"];

function isHealthOutcomeColumn(column) {
  return /^(depression|anxiety|burnout|ptsd|stress_level)$/i.test(column) ||
    /^(depression|anxiety|stress|ptsd|burnout)_(symptom_)?(indicator|level|band)$/i.test(column) ||
    /^overall_screening_band$/i.test(column);
}

function isIdentifierColumn(column) {
  return /(^|_)(id|identifier)$/i.test(column) || /^(name|email|timestamp)$/i.test(column);
}

const starterQuestionSections = [
  {
    title: "About you",
    fields: [
      { number: "01", key: "Age", question: "How old are you?", type: "number", min: 16, max: 59, step: 1 },
      { number: "02", key: "Gender", question: "What is your gender?", options: [["Female", "Female"], ["Male", "Male"]] },
      { number: "03", key: "Occupation", question: "Which option best describes your current occupation?", options: [["Student", "Student"], ["Employed", "Employed"], ["Unemployed", "Unemployed"]] }
    ]
  },
  {
    title: "Daily habits",
    fields: [
      { number: "04", key: "Daily_Screen_Time", question: "On an average day, how many hours do you spend using screens?", type: "number", min: 2, max: 12, step: 0.1 },
      { number: "05", key: "Social_Media_Usage", question: "On an average day, how many hours do you spend on social media?", type: "number", min: 1, max: 8, step: 0.1 },
      { number: "06", key: "Night_Usage", question: "Do you use a screen at night?", options: [["0", "No"], ["1", "Yes"]] },
      { number: "07", key: "Sleep_Hours", question: "How many hours do you usually sleep each night?", type: "number", min: 3, max: 9, step: 0.1 },
      { number: "08", key: "Work_Study_Hours", question: "How many hours do you spend working or studying each day?", type: "number", min: 2, max: 12, step: 0.1 },
      { number: "09", key: "Physical_Activity", question: "How would you describe your usual level of physical activity?", options: [["Low", "Low"], ["Medium", "Medium"], ["High", "High"]] },
      { number: "10", key: "Caffeine_Intake", question: "What is your caffeine intake score in this dataset?", type: "number", min: 0, max: 4, step: 1 },
      { number: "11", key: "Smoking", question: "Do you currently smoke?", options: [["0", "No"], ["1", "Yes"]] },
      { number: "12", key: "Alcohol", question: "Do you consume alcohol?", options: [["0", "No"], ["1", "Yes"]] }
    ]
  },
  {
    title: "Wellbeing",
    fields: [
      { number: "13", key: "Stress_Level", question: "How would you rate your stress level from 1 (low) to 10 (high)?", type: "number", min: 1, max: 10, step: 1 },
      { number: "14", key: "Social_Interaction_Score", question: "How would you rate your level of social interaction on a scale of 1 to 10?", type: "number", min: 1, max: 10, step: 1 }
    ]
  },
  {
    title: "Additional wellbeing check-in",
    description: "These five reflection questions are not columns in the training file, so they are not used by the prediction model.",
    fields: [
      { number: "15", key: "Reflection_Anxiety", question: "Over the past two weeks, how often have you felt nervous, anxious, or on edge?", options: [["Never", "Never"], ["Sometimes", "Sometimes"], ["Often", "Often"], ["Almost always", "Almost always"], ["Prefer not to say", "Prefer not to say"]] },
      { number: "16", key: "Reflection_Mood", question: "Over the past two weeks, how often have you felt low or had little interest in usual activities?", options: [["Never", "Never"], ["Sometimes", "Sometimes"], ["Often", "Often"], ["Almost always", "Almost always"], ["Prefer not to say", "Prefer not to say"]] },
      { number: "17", key: "Reflection_Stress_Impact", question: "How often have stress or mood concerns affected your sleep, work, study, or relationships?", options: [["Never", "Never"], ["Sometimes", "Sometimes"], ["Often", "Often"], ["Almost always", "Almost always"], ["Prefer not to say", "Prefer not to say"]] },
      { number: "18", key: "Reflection_Support", question: "How supported do you feel by people you trust?", options: [["Not at all", "Not at all"], ["A little", "A little"], ["Somewhat", "Somewhat"], ["Very supported", "Very supported"], ["Prefer not to say", "Prefer not to say"]] },
      { number: "19", key: "Reflection_Reminders", question: "How often have unwanted reminders of a difficult event or feeling on guard affected you?", options: [["Never", "Never"], ["Sometimes", "Sometimes"], ["Often", "Often"], ["Almost always", "Almost always"], ["Prefer not to say", "Prefer not to say"]] }
    ]
  }
];

const demoRows = [
  { Feature_1: 1, Feature_2: 2, Target: 0 },
  { Feature_1: 2, Feature_2: 1, Target: 0 },
  { Feature_1: 2, Feature_2: 3, Target: 0 },
  { Feature_1: 3, Feature_2: 2, Target: 0 },
  { Feature_1: 4, Feature_2: 3, Target: 0 },
  { Feature_1: 5, Feature_2: 4, Target: 0 },
  { Feature_1: 6, Feature_2: 7, Target: 1 },
  { Feature_1: 7, Feature_2: 6, Target: 1 },
  { Feature_1: 8, Feature_2: 9, Target: 1 },
  { Feature_1: 9, Feature_2: 8, Target: 1 },
  { Feature_1: 10, Feature_2: 9, Target: 1 },
  { Feature_1: 11, Feature_2: 10, Target: 1 }
];

const synapseParticles = [
  [220, 44], [220, 80], [220, 116], [220, 152], [220, 188], [220, 224], [220, 260], [220, 296], [220, 332], [220, 368], [220, 404], [220, 440], [220, 476], [220, 512],
  [181, 92], [153, 111], [121, 134], [92, 160], [259, 101], [292, 127], [326, 150], [352, 176],
  [177, 169], [147, 188], [111, 215], [82, 239], [263, 180], [295, 202], [330, 228], [359, 254],
  [178, 254], [145, 277], [113, 302], [84, 327], [261, 266], [294, 291], [328, 316], [359, 342],
  [182, 346], [151, 370], [119, 396], [91, 421], [258, 357], [291, 383], [323, 409], [353, 435],
  [191, 434], [164, 456], [136, 477], [110, 497], [249, 444], [276, 466], [304, 486], [331, 507]
];

function NeuronNetwork() {
  const [hovered, setHovered] = useState(false);
  const [pointer, setPointer] = useState({ x: -1000, y: -1000 });
  function trackPointer(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({ x: ((event.clientX - bounds.left) / bounds.width) * 440, y: ((event.clientY - bounds.top) / bounds.height) * 560 });
  }

  return (
    <div className="neural-visual">
      <div className={`neural-field ${hovered ? "is-active" : ""}`} role="img" aria-label="Interactive neuron and spinal nerve visualization" onPointerEnter={() => setHovered(true)} onPointerMove={trackPointer} onPointerLeave={() => { setHovered(false); setPointer({ x: -1000, y: -1000 }); }}>
        <svg className="neural-svg" viewBox="0 0 440 560" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <radialGradient id="neural-aura"><stop stopColor="#19d98a" stopOpacity=".17"/><stop offset=".45" stopColor="#08a9e0" stopOpacity=".09"/><stop offset="1" stopColor="#07162b" stopOpacity="0"/></radialGradient>
            <linearGradient id="axon-gradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#35d6ee"/><stop offset=".48" stopColor="#35f2a4"/><stop offset="1" stopColor="#54c7ff"/></linearGradient>
            <linearGradient id="dendrite-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#37d9ee" stopOpacity=".9"/><stop offset="1" stopColor="#56e6a7" stopOpacity=".58"/></linearGradient>
            <filter id="neural-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <ellipse className="neural-aura" cx="220" cy="280" rx="188" ry="270" fill="url(#neural-aura)" />
          <g className="neural-orbit-lines" fill="none" stroke="#54cfe746" strokeWidth=".8">
            <ellipse cx="220" cy="280" rx="94" ry="250" />
            <ellipse cx="220" cy="280" rx="150" ry="215" transform="rotate(24 220 280)" />
            <ellipse cx="220" cy="280" rx="150" ry="215" transform="rotate(-24 220 280)" />
          </g>
          <g className="neural-orbiting-synapses" fill="#6df5dc" filter="url(#neural-glow)">
            <circle cx="220" cy="30" r="3.2"/><circle cx="220" cy="530" r="2.5"/><circle cx="72" cy="280" r="2.8"/><circle cx="368" cy="280" r="3.1"/>
          </g>
          <g className="neural-branches" fill="none" stroke="url(#dendrite-gradient)" strokeLinecap="round" strokeLinejoin="round">
            <path d="M220 64 C201 100 197 130 185 158 C170 194 181 216 193 244 C205 273 194 305 184 333 C173 366 187 394 199 420 C211 448 209 482 220 520" />
            <path d="M220 92 C193 92 176 99 157 113 L137 128 L119 130 M157 113 L148 94 M137 128 L111 150 L94 151 M111 150 L104 170" />
            <path d="M220 94 C247 94 267 103 286 117 L307 132 L328 135 M286 117 L297 98 M307 132 L333 153 L350 155 M333 153 L340 174" />
            <path d="M203 166 C179 168 158 180 139 195 L116 211 L96 214 M139 195 L132 176 M116 211 L91 232 L75 234 M91 232 L84 251" />
            <path d="M237 174 C260 177 281 188 301 204 L323 221 L345 224 M301 204 L308 185 M323 221 L349 241 L365 244 M349 241 L355 260" />
            <path d="M204 260 C182 266 163 278 146 294 L124 311 L104 313 M146 294 L139 275 M124 311 L99 333 L82 336 M99 333 L93 351" />
            <path d="M236 265 C259 270 280 283 298 299 L320 316 L342 319 M298 299 L305 280 M320 316 L345 338 L362 340 M345 338 L351 357" />
            <path d="M204 357 C183 365 166 378 150 395 L129 414 L108 417 M150 395 L143 376 M129 414 L106 436 L90 438 M106 436 L100 454" />
            <path d="M236 365 C257 372 275 386 292 402 L313 420 L335 423 M292 402 L300 383 M313 420 L338 442 L355 445 M338 442 L344 461" />
            <path d="M211 453 C191 462 177 475 162 490 L143 507 L124 509 M162 490 L155 472 M230 455 C250 463 265 477 280 492 L299 508 L319 510 M280 492 L287 473" />
          </g>
          <path className="central-axon-glow" d="M220 48 C214 136 228 188 218 276 C210 365 227 430 220 520" fill="none" stroke="url(#axon-gradient)" strokeWidth="13" strokeLinecap="round" filter="url(#neural-glow)" />
          <path className="central-axon-core" d="M220 48 C214 136 228 188 218 276 C210 365 227 430 220 520" fill="none" stroke="#a4ffe0" strokeWidth="2" strokeLinecap="round" />
          <g className="spine-synapses" filter="url(#neural-glow)">
            {[72, 108, 144, 180, 216, 252, 288, 324, 360, 396, 432, 468, 504].map((y, index) => (
              <g key={y} className="spine-synapse" style={{ "--pulse-delay": `${index * 110}ms` }}>
                <circle cx="220" cy={y} r="7" fill="#0c2d39" stroke="#48e7b5" strokeWidth="1.2" />
                <circle cx="220" cy={y} r="2.8" fill="#b0ffe6" />
              </g>
            ))}
          </g>
          <g className="neuron-somas">
            {[[119, 130], [328, 135], [96, 214], [345, 224], [104, 313], [342, 319], [108, 417], [335, 423], [124, 509], [319, 510]].map(([x, y], index) => (
              <g key={`${x}-${y}`} className="neuron-soma" style={{ "--pulse-delay": `${index * 170}ms` }} transform={`translate(${x} ${y})`}>
                <circle r="10" fill="#0b1c2c" stroke="#43d9e8" strokeWidth="1.2" />
                <circle r="4" fill="#43eba9" fillOpacity=".9" />
                <circle cx="-14" cy="-11" r="1.5" fill="#79efff" />
                <circle cx="13" cy="10" r="1.4" fill="#71f0c1" />
              </g>
            ))}
          </g>
          <g className="synapse-scatter" aria-hidden="true">
            {synapseParticles.map(([x, y], index) => {
              const dx = x - pointer.x;
              const dy = y - pointer.y;
              const distance = Math.hypot(dx, dy) || 1;
              const force = hovered ? Math.max(0, 110 - distance) * 0.52 : 0;
              return <circle key={index} cx={x} cy={y} r={index % 4 === 0 ? 2 : 1.35} style={{ transform: `translate(${(dx / distance) * force}px, ${(dy / distance) * force}px)`, transitionDelay: `${(index % 6) * 15}ms` }} />;
            })}
          </g>
          <g className="neural-sparkles" fill="#a5f6e4"><circle cx="71" cy="79" r="1.5"/><circle cx="370" cy="101" r="1.2"/><circle cx="61" cy="385" r="1.3"/><circle cx="376" cy="480" r="1.5"/><circle cx="330" cy="52" r="1"/></g>
        </svg>
      </div>
    </div>
  );
}

function ReflectionChart({ answers }) {
  const items = [
    ["Never", "#68758f"],
    ["Sometimes", "#56b6c7"],
    ["Often", "#a96cea"],
    ["Almost always", "#e17ecb"],
    ["Prefer not to say", "#77717d"]
  ];
  const keys = ["Reflection_Anxiety", "Reflection_Mood", "Reflection_Stress_Impact", "Reflection_Reminders"];
  const values = items.map(([name]) => ({ name, count: keys.filter((key) => answers[key] === name).length }));
  return (
    <div className="reflection-chart">
      <div><span>YOUR RESPONSES</span><h4>Wellbeing check-in pattern</h4></div>
      <div className="reflection-chart-body">
        <ResponsiveContainer width="100%" height={215}>
          <PieChart>
            <Pie data={values.filter((item) => item.count > 0)} dataKey="count" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={4} stroke="none">
              {values.filter((item) => item.count > 0).map((item) => <Cell key={item.name} fill={items.find(([name]) => name === item.name)?.[1]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#17131f", border: "1px solid #49375c", borderRadius: 8, color: "#f5f4fa" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <p>Counts your selected answers across four reflection questions.</p>
      </div>
    </div>
  );
}

function OutcomeVisual({ predictions, actuals, statusFor }) {
  const colors = ["#6d7184", "#bb69eb", "#55c4d4", "#e77dc8", "#e8b95f"];
  const counts = new Map();
  predictions.forEach(({ prediction }) => {
    const label = String(prediction);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  const chartData = [...counts.entries()].map(([label, count]) => ({
    name: /^-?\d+(\.\d+)?$/.test(label) ? `Class ${label}` : label,
    count
  }));
  const classOneCount = predictions.filter(({ prediction }) => String(prediction).trim() === "1").length;
  const healthPredictions = predictions.filter(({ target }) => /^(depression|anxiety|burnout|ptsd)(_|$)/i.test(target));
  const healthClasses = healthPredictions.map(({ prediction }) => String(prediction).trim().toLowerCase());
  const positiveLabels = new Set(["1", "yes", "true", "positive", "indicated", "indicator present"]);
  const negativeLabels = new Set(["0", "no", "false", "negative", "not indicated"]);
  const healthClassesKnown = healthClasses.length > 0 && healthClasses.every((label) => positiveLabels.has(label) || negativeLabels.has(label));
  const positiveHealthCount = healthClasses.filter((label) => positiveLabels.has(label)).length;
  const hasHealthOutcome = healthPredictions.length > 0;
  const hasPTSD = predictions.some(({ target }) => /ptsd/i.test(target));
  const healthLevel = !healthClassesKnown ? "Review dataset class labels" : positiveHealthCount === 0 ? "No class-1 indicators predicted" : positiveHealthCount === 1 ? "One class-1 indicator predicted" : "Multiple class-1 indicators predicted";

  return (
    <div className="outcome-visual">
      <div className="outcome-visual-heading">
        <div><span>MODEL OUTPUT</span><h4>Predicted outcome profile</h4></div>
        <div className="outcome-total"><strong>{predictions.length}</strong><small>target{predictions.length === 1 ? "" : "s"}</small></div>
      </div>
      {hasHealthOutcome && (
        <div className="health-level-banner">
          <div><span>Predicted indicator level</span><strong>{healthLevel}</strong></div>
          <b>{healthClassesKnown ? `${positiveHealthCount} / ${healthPredictions.length}` : "—"}</b>
          <small>Count of selected health targets assigned the positive-coded class. This is not a symptom-severity or overall mental-health scale.</small>
        </div>
      )}
      <div className="outcome-visual-main">
        <div className="outcome-donut">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={chartData} dataKey="count" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4} stroke="none">
                {chartData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#17131f", border: "1px solid #49375c", borderRadius: 8, color: "#f5f4fa" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="outcome-donut-center"><strong>{predictions.length}</strong><span>outputs</span></div>
        </div>
        <div className="outcome-condition-grid">
          {predictions.map(({ target, prediction }, index) => (
            <div className="outcome-condition" key={target} style={{ "--condition-accent": colors[index % colors.length] }}>
              <span>{target}</span>
              <strong>Predicted: {String(prediction)}</strong>
              <small>{statusFor(prediction)}</small>
              {actuals && actuals[target] !== null && actuals[target] !== undefined && <em>Recorded label: {String(actuals[target])}</em>}
            </div>
          ))}
          {hasHealthOutcome && !hasPTSD && (
            <div className="outcome-condition outcome-unavailable">
              <span>PTSD</span><strong>Not evaluated</strong><small>This dataset has no PTSD target label, so the model cannot predict PTSD.</small>
            </div>
          )}
        </div>
      </div>
      <div className="outcome-pattern">
        <b>Model class summary</b>
        <span>{classOneCount} of {predictions.length} selected targets were assigned dataset class 1.</span>
      </div>
      <p className="outcome-disclaimer">The chart counts predicted dataset classes. It does not show confidence, symptom severity, or an overall clinical mental-health level. Interpret class codes using the dataset codebook.</p>
    </div>
  );
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((v) => String(v).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  row.push(cell);
  if (row.some((v) => String(v).trim() !== "")) rows.push(row);

  if (rows.length < 2) throw new Error("CSV must contain a header and at least one data row.");

  const headers = rows[0].map((h, i) => String(h).trim() || `Column_${i + 1}`);
  return rows.slice(1).map((values) => {
    const obj = {};
    headers.forEach((h, i) => {
      const value = values[i] ?? "";
      const trimmed = String(value).trim();
      if (trimmed === "") obj[h] = null;
      else if (!Number.isNaN(Number(trimmed))) obj[h] = Number(trimmed);
      else obj[h] = trimmed;
    });
    return obj;
  });
}

function App() {
  const [algo, setAlgo] = useState("Logistic Regression");
  const [online, setOnline] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [predictionBusy, setPredictionBusy] = useState(false);
  const [predictionInputs, setPredictionInputs] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [testOpen, setTestOpen] = useState(false);
  const [starterAnswers, setStarterAnswers] = useState({});
  const [starterResult, setStarterResult] = useState(null);
  const starterResultRef = useRef(null);
  const predictionResultRef = useRef(null);
  const singleRecordResultRef = useRef(null);
  const [datasetReady, setDatasetReady] = useState(false);
  const [singleRecordIndex, setSingleRecordIndex] = useState("0");
  const [singleRecordResult, setSingleRecordResult] = useState(null);

  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("No dataset loaded");
  const [target, setTarget] = useState("");
  const [extraTargets, setExtraTargets] = useState([]);
  const [nextTarget, setNextTarget] = useState("");
  const [features, setFeatures] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const fileInputRef = useRef(null);

  const columns = useMemo(
    () => (rows.length ? Object.keys(rows[0]) : []),
    [rows]
  );
  const selectedTargets = [...new Set([target, ...extraTargets].filter(Boolean))];
  const targetOptions = useMemo(() => columns.filter((column) => {
    const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && String(value).trim() !== "");
    if (!values.length) return false;
    const numericCount = values.filter((value) => Number.isFinite(Number(value))).length;
    const numericLike = numericCount / values.length >= 0.8;
    const uniqueCount = new Set(values.map((value) => String(value))).size;
    return !(numericLike && uniqueCount > 20);
  }), [columns, rows]);
  const healthLabelColumns = useMemo(() => columns.filter((column) => /^(depression|anxiety|burnout|ptsd)$/i.test(column)), [columns]);
  const healthLabelDistribution = useMemo(() => healthLabelColumns.map((column) => {
    const values = rows.map((row) => String(row[column] ?? "").trim().toLowerCase());
    const classZero = values.filter((value) => ["0", "no", "false", "negative"].includes(value)).length;
    const classOne = values.filter((value) => ["1", "yes", "true", "positive"].includes(value)).length;
    return { target: column, "Class 0": classZero, "Class 1": classOne };
  }), [healthLabelColumns, rows]);
  const stressDistribution = useMemo(() => {
    const column = columns.find((item) => /^stress_level$/i.test(item));
    if (!column) return [];
    const counts = new Map();
    rows.forEach((row) => {
      const raw = String(row[column] ?? "").trim();
      if (!raw) return;
      const numeric = Number(raw);
      const value = Number.isFinite(numeric) ? numeric : raw;
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return [...counts.entries()].sort(([a], [b]) => {
      const left = Number(a), right = Number(b);
      return Number.isFinite(left) && Number.isFinite(right) ? left - right : String(a).localeCompare(String(b));
    }).map(([level, count]) => ({ level: String(level), count }));
  }, [columns, rows]);

  useEffect(() => {
    fetch(`${API}/api/health`)
      .then((r) => setOnline(r.ok))
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    if (!columns.length) return;
    setFeatures((current) => {
      const valid = current.filter((c) => columns.includes(c) && !selectedTargets.includes(c));
      return valid.length ? valid : columns.filter((c) => !selectedTargets.includes(c)).slice(0, 5);
    });
    if (!target || !columns.includes(target)) {
      const possibleTarget = columns[columns.length - 1];
      setTarget(possibleTarget);
    }
  }, [columns, target, extraTargets]);

  useEffect(() => {
    if (starterResult?.answers) starterResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [starterResult]);

  useEffect(() => {
    if (predictionResult?.predictions) predictionResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [predictionResult]);

  useEffect(() => {
    if (singleRecordResult?.predictions) singleRecordResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [singleRecordResult]);

  function setDataset(dataRows, name) {
    if (!dataRows || !dataRows.length) throw new Error("No data rows found.");
    const cols = Object.keys(dataRows[0]);
    if (cols.length < 2) throw new Error("Dataset needs at least two columns.");

    const healthTargets = cols.filter(isHealthOutcomeColumn);
    const targetCandidates = cols.filter((column) => {
      const values = dataRows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && String(value).trim() !== "");
      const numericCount = values.filter((value) => Number.isFinite(Number(value))).length;
      const numericLike = values.length > 0 && numericCount / values.length >= 0.8;
      return !(numericLike && new Set(values.map((value) => String(value))).size > 20);
    });
    const chosenTargets = healthTargets.length ? healthTargets : [targetCandidates[targetCandidates.length - 1]].filter(Boolean);
    if (!chosenTargets.length) throw new Error("This dataset has no categorical target. Choose a class/level column; continuous numeric columns cannot be classification targets.");

    const excluded = [...new Set([...chosenTargets, ...cols.filter(isHealthOutcomeColumn), ...cols.filter(isIdentifierColumn)])];
    const predictorColumns = cols.filter((column) => !excluded.includes(column));
    if (!predictorColumns.length) throw new Error("No predictor columns remain after excluding IDs and target labels.");

    setRows(dataRows);
    setDatasetReady(true);
    setSingleRecordIndex("0");
    setSingleRecordResult(null);
    setFileName(name);
    setTarget(chosenTargets[0]);
    setExtraTargets(chosenTargets.slice(1));
    setNextTarget("");
    setFeatures(predictorColumns);
    setResult(null);
    setUploadMessage(healthTargets.length
      ? `Detected health labels: ${chosenTargets.join(", ")}. Continuous numeric columns are kept out of the target list.`
      : "Dataset loaded. Choose a categorical class/level target; continuous numeric columns are not valid classification targets.");
    setModelReady(false);
    setPredictionInputs({});
    setPredictionResult(null);
  }

  async function uploadFile(file) {
    if (!file) return;

    const allowed = /\.(csv|xlsx)$/i.test(file.name);
    if (!allowed) {
      setResult({ error: "Please select a .csv or .xlsx file." });
      return;
    }

    setUploading(true);
    setResult(null);
    setUploadMessage("");

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch(`${API}/api/upload-dataset`, {
        method: "POST",
        body: form
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("The backend returned an invalid response. Make sure Flask is running.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not read the dataset.");
      }

      setDataset(data.rows, data.filename || file.name);
      setUploadMessage(`Dataset uploaded successfully: ${data.filename || file.name} — ${data.row_count} rows × ${data.columns.length} columns.`);
    } catch (error) {
      setResult({ error: error.message || "Could not load the dataset." });
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event) {
    uploadFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    uploadFile(event.dataTransfer.files?.[0]);
  }

  function loadPastedCSV() {
    try {
      const parsed = parseCSV(pasteText);
      setDataset(parsed, "Pasted CSV data");
      setPasteText("");
      setShowPaste(false);
    } catch (error) {
      setResult({ error: error.message });
    }
  }

  function toggleFeature(column) {
    setFeatures((current) =>
      current.includes(column)
        ? current.filter((c) => c !== column)
        : [...current, column]
    );
    setModelReady(false);
    setPredictionResult(null);
  }

  function predictedStatus(value) {
    const label = String(value).trim().toLowerCase().replace(/[_-]+/g, " ");
    if (["normal", "none", "minimal", "low", "not indicated", "no", "false", "negative", "no symptoms", "no depression", "no anxiety", "no stress", "no ptsd", "lower indicator pattern"].includes(label)) {
      return "The model predicted its lower-indicator class. This is not a clinical assessment.";
    }
    if (["yes", "true", "positive", "indicator present", "indicated", "mild", "moderate", "severe", "extremely severe", "high", "elevated", "some elevated indicators", "several elevated indicators", "elevated indicator pattern"].includes(label)) {
      return "The model predicted a symptom indicator or higher band. Consider discussing concerns with a qualified professional.";
    }
    if (/^-?\d+(\.\d+)?$/.test(label)) {
      return "Dataset class code; use the dataset codebook to interpret it. Not a diagnosis.";
    }
    return "The model returned this class label. Interpret it using the dataset's codebook.";
  }

  function summarizePredictions(predictions) {
    const labels = predictions.map(({ prediction }) => String(prediction).trim().toLowerCase().replace(/[_-]+/g, " "));
    const lower = new Set(["normal", "none", "minimal", "low", "not indicated", "no", "false", "negative", "no symptoms", "no depression", "no anxiety", "no stress", "no ptsd"]);
    const higher = new Set(["yes", "true", "positive", "indicator present", "indicated", "mild", "moderate", "severe", "extremely severe", "high", "elevated", "some elevated indicators", "several elevated indicators"]);
    if (labels.length && labels.every((label) => lower.has(label))) {
      return "All selected targets were predicted in their lower-severity classes. This does not establish that a person is mentally well.";
    }
    if (labels.some((label) => higher.has(label))) {
      return "At least one selected target was predicted outside its lower-severity class. Consider discussing concerns with a qualified professional.";
    }
    return "Overall status cannot be inferred from these labels alone. Check the dataset codebook to interpret numeric or custom class labels.";
  }

  function submitStarterTest() {
    const allFields = starterQuestionSections.flatMap((section) => section.fields);
    const missing = allFields.filter((field) => String(starterAnswers[field.key] ?? "").trim() === "");
    if (missing.length) {
      setStarterResult({ error: `Please answer all questions. ${missing.length} remaining.` });
      return;
    }
    setStarterResult({
      answers: allFields.map((field) => ({
        question: field.question,
        value: starterAnswers[field.key],
        displayValue: field.options?.find(([value]) => value === starterAnswers[field.key])?.[1] ?? starterAnswers[field.key]
      }))
    });
  }

  async function predictUser() {
    if (!modelReady || !features.length) return;
    const missing = features.filter((column) => String(predictionInputs[column] ?? "").trim() === "");
    if (missing.length) {
      setPredictionResult({ error: `Enter a value for every selected feature. Missing: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : ""}` });
      return;
    }

    setPredictionBusy(true);
    setPredictionResult(null);
    try {
      const row = Object.fromEntries(features.map((column) => {
        const value = predictionInputs[column];
        const firstValue = rows.find((item) => item[column] !== null && item[column] !== undefined)?.[column];
        const parsed = typeof firstValue === "number" ? Number(value) : value;
        return [column, parsed];
      }));
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row })
      });
      const data = await response.json();
      setPredictionResult(response.ok ? data : { error: data.error || "Prediction failed." });
    } catch {
      setPredictionResult({ error: "Could not connect to the Flask backend." });
    } finally {
      setPredictionBusy(false);
    }
  }

  async function predictDatasetRecord() {
    if (!modelReady) {
      setSingleRecordResult({ error: "Run the selected algorithm first, then predict an uploaded record." });
      return;
    }
    const index = Number(singleRecordIndex) - 1;
    const sourceRow = rows[index];
    if (!sourceRow) {
      setSingleRecordResult({ error: "Select a valid row from the uploaded dataset." });
      return;
    }

    setPredictionBusy(true);
    setSingleRecordResult(null);
    try {
      const row = Object.fromEntries(features.map((column) => [column, sourceRow[column]]));
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row })
      });
      const data = await response.json();
      if (!response.ok) {
        setSingleRecordResult({ error: data.error || "Prediction failed." });
      } else {
        setSingleRecordResult({
          ...data,
          rowNumber: index + 1,
          actuals: Object.fromEntries(selectedTargets.map((name) => [name, sourceRow[name]]))
        });
      }
    } catch {
      setSingleRecordResult({ error: "Could not connect to the Flask backend." });
    } finally {
      setPredictionBusy(false);
    }
  }

  async function run() {
    if (!online) {
      setResult({ error: "Backend is not running. Start Flask from the backend folder with: py app.py" });
      return;
    }

    if (!datasetReady) {
      setResult({ error: "Upload a labeled dataset or load a demo dataset first." });
      return;
    }

    const selectedAlgo = algo;

    if (!features.length) {
      setResult({ error: "Select at least one feature column." });
      return;
    }

    if (!selectedTargets.length) {
      setResult({ error: "Select at least one condition-level target." });
      return;
    }

    setBusy(true);
    setResult(null);
    setModelReady(false);
    setPredictionResult(null);
    setSingleRecordResult(null);

    try {
      const response = await fetch(`${API}/api/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm: selectedAlgo,
          rows,
          target: selectedTargets[0],
          targets: selectedTargets,
          features,
          k: 3,
          components: 2
        })
      });

      const data = await response.json();
      setResult(response.ok ? data : { error: data.error || "Training failed." });
      setModelReady(response.ok);
      if (response.ok) {
        setPredictionInputs(Object.fromEntries(features.map((column) => [column, starterAnswers[column] ?? ""])));
      }
    } catch {
      setResult({ error: "Could not connect to the Flask backend." });
      setModelReady(false);
    } finally {
      setBusy(false);
    }
  }

  async function loadSyntheticDataset() {
    try {
      const response = await fetch("/synthetic_mental_health_demo.csv");
      if (!response.ok) throw new Error("Could not load the synthetic sample dataset.");
      const text = await response.text();
      setDataset(parseCSV(text), "Synthetic mental-health demo (artificial data)");
    } catch (error) {
      setResult({ error: error.message || "Could not load the sample dataset." });
    }
  }

  function resetDemo() {
    setDataset(demoRows, "Built-in demo dataset");
    setUploadMessage("Using the built-in demo dataset.");
  }

  const resultMetricRows = (result?.targets || []).map(({ target: targetName, metrics }) => ({
    target: targetName,
    Accuracy: metrics.Accuracy,
    Precision: metrics.Precision,
    Recall: metrics.Recall,
    "F1 Score": metrics["F1 Score"]
  }));
  const metricNames = ["Accuracy", "Precision", "Recall", "F1 Score"];
  const areaMetricRows = metricNames.map((metric) => ({
    metric,
    ...Object.fromEntries(resultMetricRows.map((row) => [row.target, row[metric]]))
  }));

  return (
    <div className="app">
      <aside>
        <div className="logo">Mental Health Lab</div>
        <div className="nav active">Dashboard</div>
        <div className="label">ALGORITHMS</div>

        {algorithms.map((algorithm) => (
          <button
            className={`algo ${algorithm === algo ? "selected" : ""}`}
            key={algorithm}
            onClick={() => {
              setAlgo(algorithm);
              setResult(null);
              setModelReady(false);
              setPredictionResult(null);
            }}
          >
            {algorithm}
          </button>
        ))}
      </aside>

      <main>
        <header>
          <div>
            <h1>Machine Learning Lab</h1>
            <p>Train on labeled examples, then try a prediction for one new person.</p>
          </div>
          <div className={online ? "online" : "offline"}>
            {online ? "● API Online" : "● API Offline"}
          </div>
        </header>

        <div className="breadcrumb">
          Models <b>›</b> {algo}
        </div>

        <section className="hero">
          <div className="hero-copy">
            <span>YOUR MENTAL HEALTH DATA LAB</span>
            <h2>Understand patterns.<br />Support wellbeing.</h2>
            <p>{algo} · Explore survey data with a clear, explainable workflow.</p>
            <button className="run" disabled={!online || !datasetReady || busy} onClick={run}>
              {busy ? "Running..." : !datasetReady ? "Load a dataset to begin" : "Run Algorithm →"}
            </button>
          </div>
          <div className="mental-animation" aria-hidden="true">
            <div className="animation-glow" />
            <div className="animation-ring ring-one" />
            <div className="animation-ring ring-two" />
            <svg className="mind-graphic" viewBox="0 0 360 250" role="presentation">
              <defs>
                <radialGradient id="mindAura"><stop offset="0" stopColor="#eea4ff" stopOpacity=".9"/><stop offset=".45" stopColor="#a56bff" stopOpacity=".42"/><stop offset="1" stopColor="#6c5bff" stopOpacity="0"/></radialGradient>
                <linearGradient id="mindStroke" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff85dc"/><stop offset=".52" stopColor="#a58cff"/><stop offset="1" stopColor="#67e7ff"/></linearGradient>
              </defs>
              <circle className="mind-aura" cx="180" cy="125" r="92" fill="url(#mindAura)"/>
              <ellipse className="mind-orbit" cx="180" cy="125" rx="124" ry="47" fill="none" stroke="#caa5ff" strokeOpacity=".34"/>
              <ellipse className="mind-orbit orbit-tilt" cx="180" cy="125" rx="124" ry="47" fill="none" stroke="#85eaff" strokeOpacity=".28"/>
              <path className="brain-outline" d="M179 75c-15-19-43-8-40 14-22 3-29 29-14 43-14 18-3 41 17 42 7 20 31 23 43 8 13 14 37 9 40-10 21-6 23-32 9-43 11-19-3-39-23-39-4-23-29-29-45-15-8-5-19-4-27 0Z" fill="none" stroke="url(#mindStroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path className="brain-fold" d="M179 79c-7 12-6 22 1 31-10 5-13 16-8 25-8 7-7 19-1 26m9-81c8 5 11 14 8 22 10 1 16 8 15 17 8 6 8 16 3 24m-33-17c9 2 15 8 15 16m-17-39c8-2 14 1 18 7" fill="none" stroke="#e6c7ff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round"/>
              <circle className="mind-node node-one" cx="94" cy="126" r="4" fill="#ff91dc"/><circle className="mind-node node-two" cx="269" cy="100" r="3.5" fill="#73eaff"/><circle className="mind-node node-three" cx="240" cy="178" r="3" fill="#c59aff"/>
              <path className="calm-wave" d="M87 207h53l9-11 10 21 11-34 12 24 9-11h84" fill="none" stroke="url(#mindStroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </section>

        <section className="model-choice-section" aria-label="Model differences">
          <div className="model-choice-heading">
            <div><h3>Choose a model</h3><p>Both models use the same selected features and target. Compare their held-out metrics after training.</p></div>
            <span className="current-model">Selected: {algo}</span>
          </div>
          <div className="model-choice-grid">
            <button type="button" className={`model-choice ${algo === "Logistic Regression" ? "selected" : ""}`} onClick={() => { setAlgo("Logistic Regression"); setResult(null); setModelReady(false); setPredictionResult(null); }}>
              <span className="model-kicker">01 · LINEAR CLASSIFIER</span>
              <strong>Logistic Regression</strong>
              <span className="model-description">A fast, straightforward baseline that is easier to interpret. Useful for comparing simple feature relationships.</span>
              <span className="model-trait">Simpler to explain</span>
            </button>
            <button type="button" className={`model-choice ${algo === "Random Forest" ? "selected" : ""}`} onClick={() => { setAlgo("Random Forest"); setResult(null); setModelReady(false); setPredictionResult(null); }}>
              <span className="model-kicker">02 · TREE ENSEMBLE</span>
              <strong>Random Forest</strong>
              <span className="model-description">Combines decision trees to learn more complex feature patterns. Its decisions can be less straightforward to explain.</span>
              <span className="model-trait">Models complex patterns</span>
            </button>
          </div>
        </section>
        <section className="card dataset-card">
          <div className="section-title-row">
            <div>
              <h3>Dataset</h3>
              <p className="subtext">Upload a CSV/Excel file, drag it here, or paste CSV data.</p>
            </div>
            <div className="demo-actions">
              <button className="secondary" onClick={loadSyntheticDataset}>Load Synthetic Mental-Health Data</button>
              <button className="secondary" onClick={resetDemo}>Basic Demo</button>
            </div>
          </div>

          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">↑</div>
            <strong>{uploading ? "Uploading and reading dataset..." : "Choose a dataset file"}</strong>
            <span>Click here or drag & drop a CSV/XLSX file • up to 50 MB</span>
            {!uploading && <button type="button" className="choose-file" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose File</button>}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              hidden
            />
          </div>

          {uploadMessage && (
            <div className="upload-success">✓ {uploadMessage}</div>
          )}
          {fileName.toLowerCase().includes("synthetic") && (
            <div className="synthetic-note">Synthetic demonstration data only. Its labels were generated from the inputs; its scores are not results from your collected survey or evidence of clinical accuracy.</div>
          )}

          <div className="dataset-actions">
            {datasetReady && <span className="file-name">📄 {fileName}</span>}
            <button className="secondary" onClick={() => setShowPaste((v) => !v)}>
              {showPaste ? "Hide Paste Box" : "Paste CSV Instead"}
            </button>
          </div>

          {showPaste && (
            <div className="paste-box">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'Age,StudyHours,Result\n18,4,Pass\n19,6,Pass\n18,1,Fail'}
              />
              <button className="secondary primary-secondary" onClick={loadPastedCSV}>
                Load Pasted Data
              </button>
            </div>
          )}

          {datasetReady && rows.length > 0 && (
            <>
              <div className="dataset-stats">
                <div><strong>{rows.length}</strong><small>Rows</small></div>
                <div><strong>{columns.length}</strong><small>Columns</small></div>
                <div><strong>{features.length}</strong><small>Features</small></div>
                <div><strong>{selectedTargets.length}</strong><small>Targets selected</small></div>
              </div>

              <div className="column-config">
                <div>
                  <label>Condition-level target(s)</label>
                  <select value={target} onChange={(e) => {
                    const next = e.target.value;
                    setTarget(next);
                    setExtraTargets((current) => current.filter((column) => column !== next));
                    setFeatures((current) => current.filter((column) => column !== next));
                    setResult(null);
                    setModelReady(false);
                    setPredictionResult(null);
                  }}>
                    {targetOptions.map((column) => <option key={column} value={column}>{column}</option>)}
                  </select>
                  <div className="selected-targets">
                    {selectedTargets.map((name) => (
                      <span className="target-chip" key={name}>
                        {name}
                        {selectedTargets.length > 1 && <button type="button" aria-label={`Remove ${name}`} onClick={() => {
                          if (name === target) {
                            const promoted = extraTargets[0];
                            setTarget(promoted);
                            setExtraTargets((current) => current.slice(1));
                          } else {
                            setExtraTargets((current) => current.filter((column) => column !== name));
                          }
                          setFeatures((current) => current.filter((column) => column !== name));
                          setModelReady(false);
                          setPredictionResult(null);
                        }}>×</button>}
                      </span>
                    ))}
                  </div>
                  {columns.filter((column) => /^(depression|anxiety|stress|ptsd)_(symptom_)?(indicator|level|band)$/i.test(column) || /^overall_screening_band$/i.test(column)).length > 1 && (
                    <button className="secondary target-bulk" type="button" onClick={() => {
                      const detected = columns.filter((column) => /^(depression|anxiety|stress|ptsd)_(symptom_)?(indicator|level|band)$/i.test(column) || /^overall_screening_band$/i.test(column));
                      setExtraTargets(detected.filter((column) => column !== target));
                      setFeatures((current) => current.filter((column) => !detected.includes(column)));
                      setModelReady(false);
                      setPredictionResult(null);
                      setResult(null);
                    }}>Add detected condition targets</button>
                  )}
                  <div className="target-add-row">
                    <select value={nextTarget} onChange={(e) => setNextTarget(e.target.value)}>
                      <option value="">Add another target…</option>
                      {columns.filter((column) => !selectedTargets.includes(column)).map((column) => <option key={column} value={column}>{column}</option>)}
                    </select>
                    <button className="secondary" type="button" disabled={!nextTarget} onClick={() => {
                      if (nextTarget && !selectedTargets.includes(nextTarget)) {
                        setExtraTargets((current) => [...current, nextTarget]);
                        setFeatures((current) => current.filter((column) => column !== nextTarget));
                        setNextTarget("");
                        setResult(null);
                        setModelReady(false);
                        setPredictionResult(null);
                      }
                    }}>Add</button>
                  </div>
                </div>

                <div>
                  <label>Feature columns</label>
                  <div className="feature-tools">
                    {columns.some((column) => /^Q\d+/i.test(column) || /_(frequency|support_level)$/i.test(column)) && (
                      <button className="secondary" type="button" onClick={() => {
                        setFeatures(columns.filter((column) => !selectedTargets.includes(column) && (/^Q\d+/i.test(column) || /_(frequency|support_level)$/i.test(column))));
                        setModelReady(false);
                        setPredictionResult(null);
                      }}>Select symptom inputs</button>
                    )}
                    <button className="secondary" type="button" onClick={() => {
                      setFeatures([]);
                      setModelReady(false);
                      setPredictionResult(null);
                    }}>Clear selection</button>
                  </div>
                  <div className="feature-list">
                    {columns.filter((c) => !selectedTargets.includes(c)).map((column) => (
                      <label className="check" key={column}>
                        <input
                          type="checkbox"
                          checked={features.includes(column)}
                          onChange={() => toggleFeature(column)}
                        />
                        {column}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="preview-wrap">
                <h4>Dataset Preview</h4>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 6).map((row, index) => (
                        <tr key={index}>
                          {columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <small className="preview-note">Showing first {Math.min(6, rows.length)} rows.</small>
              </div>
            </>
          )}
        </section>

        {datasetReady && (
          <section className="card single-record-card">
            <div className="section-title-row">
              <div>
                <h3>Predict one person from this dataset</h3>
                <p className="subtext">Choose a row to see its model prediction beside the recorded outcome, when available.</p>
              </div>
              <span className={`record-status ${modelReady ? "ready" : "waiting"}`}>{modelReady ? "Model ready" : "Train model first"}</span>
            </div>
            <div className="single-record-controls">
              <label htmlFor="single-record-select">Dataset row number (1–{rows.length})</label>
              <input id="single-record-select" type="number" min="1" max={rows.length} step="1" value={singleRecordIndex} onChange={(event) => { setSingleRecordIndex(event.target.value); setSingleRecordResult(null); }} />
              <button className="run" type="button" disabled={!modelReady || predictionBusy} onClick={predictDatasetRecord}>
                {predictionBusy ? "Predicting…" : "Predict selected row"}
              </button>
            </div>
            {!modelReady && <p className="hint single-record-hint">Upload a labeled dataset, select the targets and features, then click <b>Run Algorithm</b> to enable single-row predictions.</p>}
            {singleRecordResult?.error && <div className="error prediction-error">{singleRecordResult.error}</div>}
            {singleRecordResult?.predictions && (
              <div className="single-record-result" ref={singleRecordResultRef}>
                <h4>Prediction for Row {singleRecordResult.rowNumber}</h4>
                <OutcomeVisual predictions={singleRecordResult.predictions} actuals={singleRecordResult.actuals} statusFor={predictedStatus} />
                <p>Single-row model output for inspection. This dataset row may have been used in training, so it is not an independent accuracy test. The held-out and cross-validation scores in Results are better measures of model performance.</p>
                <details className="result-details guidance-details">
                  <summary>Supportive next steps</summary>
                  <div className="support-guidance"><ul>
                    <li>Use predicted labels as screening estimates only; they are not a diagnosis.</li>
                    <li>Encourage regular sleep, gentle activity, and connection with a trusted person where helpful.</li>
                    <li>If the person is distressed or symptoms affect daily life, encourage them to speak with a qualified mental-health professional.</li>
                  </ul></div>
                </details>
              </div>
            )}
          </section>
        )}

        <div className="test-launcher">
          <button className="run test-open-button" type="button" onClick={() => setTestOpen(true)}>
            Have a test <span aria-hidden="true">→</span>
          </button>
        </div>

        {testOpen && (
          <div className="test-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTestOpen(false);
          }}>
            <section className="test-dialog" role="dialog" aria-modal="true" aria-labelledby="test-title">
              <div className="test-dialog-heading">
                <div>
                  <span className="test-kicker">PERSONALIZED MODEL TEST</span>
                  <h2 id="test-title">Have a test</h2>
                </div>
                <button className="test-close" type="button" aria-label="Close test" onClick={() => setTestOpen(false)}>×</button>
              </div>
              {!modelReady ? (
                <>
                  <p className="subtext test-intro">Complete these questions for a self-reflection summary.</p>
                  <div className="starter-question-sections">
                    {starterQuestionSections.map((section) => (
                      <section className="starter-question-section" key={section.title}>
                        <h3>{section.title}</h3>
                        {section.description && <p className="question-section-description">{section.description}</p>}
                        <div className="prediction-grid starter-question-grid">
                          {section.fields.map((field) => (
                            <label className="question-card" key={field.key}>
                              <span className="question-heading"><b>{field.number}</b><span>{field.question}</span></span>
                              {field.options ? (
                                <select value={starterAnswers[field.key] ?? ""} onChange={(event) => { setStarterAnswers((current) => ({ ...current, [field.key]: event.target.value })); setStarterResult(null); }}>
                                  <option value="">Select an answer</option>
                                  {field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                              ) : (
                                <input type="number" min={field.min} max={field.max} step={field.step} placeholder={`Enter a value (${field.min}–${field.max})`} value={starterAnswers[field.key] ?? ""} onChange={(event) => { setStarterAnswers((current) => ({ ...current, [field.key]: event.target.value })); setStarterResult(null); }} />
                              )}
                            </label>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                  <button className="run prediction-button starter-submit" type="button" onClick={submitStarterTest}>Show my result</button>
                  {starterResult?.error && <div className="error prediction-error">{starterResult.error}</div>}
                  {starterResult?.answers && (
                    <div className="starter-summary" aria-live="polite" ref={starterResultRef}>
                      <div className="starter-summary-heading"><span>YOUR RESULT</span><h3>Wellbeing snapshot</h3></div>
                      <p>This is a self-reflection summary, not a model result or diagnosis.</p>
                      <ReflectionChart answers={starterAnswers} />
                      <details className="result-details">
                        <summary>View all {starterResult.answers.length} answers</summary>
                        <div className="starter-summary-grid">
                          {starterResult.answers.map(({ question, displayValue }, index) => (
                            <div className="starter-summary-item" key={question}><small>{String(index + 1).padStart(2, "0")} · {question}</small><strong>{displayValue}</strong></div>
                          ))}
                        </div>
                      </details>
                      <details className="result-details guidance-details">
                        <summary>Helpful next steps</summary>
                        <div className="support-guidance">
                          <ul>
                            <li>Choose one manageable routine to support sleep and take regular breaks from screens.</li>
                            <li>Try gentle physical activity and make time for a supportive social connection.</li>
                            <li>If stress or other concerns persist or interfere with daily life, talk with a qualified mental-health professional.</li>
                          </ul>
                        </div>
                      </details>
                      <div className="test-prerequisite"><p>Model predictions require a trained model and labeled outcomes in your dataset. Only outcomes present in the dataset can be predicted.</p></div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="subtext test-intro">Answer the questions using the selected dataset fields. The model will estimate <b>{selectedTargets.join(", ")}</b> with {algo}. This is a screening demonstration, not a diagnosis.</p>
                  {fileName.startsWith("Synthetic") && <p className="hint">Synthetic demonstration only: inputs and labels are artificial; results do not measure real-world or clinical performance.</p>}
                  <div className="prediction-grid">
                    {features.map((column) => {
                      const example = rows.find((item) => item[column] !== null && item[column] !== undefined)?.[column];
                      const numeric = typeof example === "number";
                      const question = starterQuestionSections.flatMap((section) => section.fields).find((field) => field.key === column)?.question;
                      const categories = numeric ? [] : [...new Set(rows.map((item) => item[column]).filter((value) => value !== null && value !== undefined && String(value).trim() !== "").map(String))];
                      return (
                        <label key={column}>
                          <span>{question || column}{numeric ? " (number)" : " (category)"}</span>
                          {numeric || categories.length > 20 ? (
                            <input
                              type={numeric ? "number" : "text"}
                              step={numeric ? "any" : undefined}
                              value={predictionInputs[column] ?? ""}
                              placeholder={numeric ? "Enter a value" : `e.g. ${String(example ?? "")}`}
                              onChange={(event) => {
                                setPredictionInputs((current) => ({ ...current, [column]: event.target.value }));
                                setPredictionResult(null);
                              }}
                            />
                          ) : (
                            <select value={predictionInputs[column] ?? ""} onChange={(event) => {
                              setPredictionInputs((current) => ({ ...current, [column]: event.target.value }));
                              setPredictionResult(null);
                            }}>
                              <option value="">Select an answer</option>
                              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
                            </select>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <button className="run prediction-button" disabled={predictionBusy} onClick={predictUser}>
                    {predictionBusy ? "Predicting…" : "Get my result"}
                  </button>
                  {predictionResult?.error && <div className="error prediction-error">{predictionResult.error}</div>}
                  {predictionResult && !predictionResult.error && (
                    <div className="prediction-result" ref={predictionResultRef}>
                      <OutcomeVisual predictions={predictionResult.predictions} statusFor={predictedStatus} />
                      <p>{summarizePredictions(predictionResult.predictions)}</p>
                      <small>Screening estimates from {predictionResult.algorithm}; not a diagnosis.</small>
                      <details className="result-details guidance-details">
                        <summary>Helpful next steps</summary>
                        <div className="support-guidance"><ul>
                          <li>Keep a steady sleep and wake routine where possible.</li>
                          <li>Try gentle physical activity and one low-stress activity you enjoy.</li>
                          <li>Stay connected with someone you trust and consider writing down what has been difficult.</li>
                        </ul><p>If symptoms persist, worsen, or interfere with daily life, discuss them with a qualified mental-health professional. These general ideas are not a treatment plan.</p></div>
                      </details>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        <div className="cards">
          <section className="card">
            <h3>Experiment</h3>
            <div className="steps">
              <div>01<br /><b>Dataset</b></div>
              <div>02<br /><b>Configure</b></div>
              <div>03<br /><b>Train</b></div>
              <div>04<br /><b>Evaluate</b></div>
            </div>
            {result && !result.error && <NeuronNetwork />}
          </section>

          <section className="card">
            <h3>Results</h3>

            {!result && <p className="empty">Run the selected algorithm to display its metrics.</p>}

            {result?.error && <div className="error">{result.error}</div>}

            {result && !result.error && (
              <>
                {result.targets?.length > 1 && (
                  <div className="target-metrics">
                    <h4>Held-out metrics by condition</h4>
                    {result.targets.map(({ target: targetName, metrics }) => (
                      <div className="target-metric-row" key={targetName}>
                        <b>{targetName}</b>
                        <span>Accuracy {(metrics.Accuracy * 100).toFixed(1)}%</span>
                        <span>F1 {(metrics["F1 Score"] * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="metrics">
                  {Object.entries(result.metrics || {}).map(([key, value]) => (
                    <div key={key}>
                      <small>{key}</small>
                      <strong>
                        {Array.isArray(value)
                          ? value.join(", ")
                          : typeof value === "number"
                          ? `${(value * 100).toFixed(1)}%`
                          : String(value)}
                      </strong>
                    </div>
                  ))}
                </div>

                {result.metrics?.Accuracy !== undefined && (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[
                        { name: "Accuracy", value: result.metrics.Accuracy },
                        { name: "Precision", value: result.metrics.Precision },
                        { name: "Recall", value: result.metrics.Recall },
                        { name: "F1", value: result.metrics["F1 Score"] }
                      ]}
                    >
                      <XAxis dataKey="name" tick={{ fill: "#c8c4d1", fontSize: 11 }} />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fill: "#aaa5b5", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#17151e", border: "1px solid #59416d", borderRadius: 8, color: "#f5f4fa" }} formatter={(value) => [`${(value * 100).toFixed(1)}%`, "Score"]} />
                      <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                        {[
                          { name: "Accuracy", color: "#a78bfa" },
                          { name: "Precision", color: "#38bdf8" },
                          { name: "Recall", color: "#34d399" },
                          { name: "F1", color: "#f472b6" }
                        ].map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {resultMetricRows.length > 0 && (
                  <div className="result-visualizations">
                    <div className="chart-panel">
                      <h4>Overall metric profile</h4>
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={metricNames.map((metric) => ({ metric, score: resultMetricRows.length ? resultMetricRows.reduce((sum, row) => sum + (row[metric] || 0), 0) / resultMetricRows.length : 0 }))}>
                          <PolarGrid gridType="circle" stroke="#51435f" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: "#e6d9f2", fontSize: 11, fontWeight: 650 }} />
                          <PolarRadiusAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fill: "#aaa5b5", fontSize: 9 }} axisLine={false} />
                          <Tooltip contentStyle={{ background: "#17151e", border: "1px solid #59416d", color: "#f5f4fa" }} formatter={(value) => [`${(value * 100).toFixed(1)}%`, "Score"]} />
                          <Radar name="Average score" dataKey="score" stroke="#d8a4ff" strokeWidth={3} fill="#9b5de5" fillOpacity={0.42} dot={{ r: 4, fill: "#f2dcff", stroke: "#9b5de5", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#ffffff", stroke: "#c084fc", strokeWidth: 2 }} isAnimationActive />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-panel result-area-panel">
                      <h4>Metric trends across health targets</h4>
                        <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={areaMetricRows} margin={{ top: 8, right: 10, left: -14, bottom: 8 }}>
                          <XAxis dataKey="metric" tick={{ fill: "#c8c4d1", fontSize: 10 }} />
                          <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fill: "#aaa5b5", fontSize: 9 }} />
                          <Tooltip contentStyle={{ background: "#17151e", border: "1px solid #59416d", color: "#f5f4fa" }} formatter={(value) => [`${(value * 100).toFixed(1)}%`, "Score"]} />
                          <Legend />
                          {resultMetricRows.map((row, index) => {
                            const colors = ["#a78bfa", "#38bdf8", "#34d399", "#f472b6", "#fbbf24"];
                            return <Area key={row.target} type="monotone" dataKey={row.target} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.14} />;
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {result.targets?.length > 1 && (
                  <div className="chart-panel">
                    <h4>Model scores by health target</h4>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={result.targets.map(({ target: targetName, metrics }) => ({ target: targetName, Accuracy: metrics.Accuracy, "F1 score": metrics["F1 Score"] }))} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                        <XAxis dataKey="target" tick={{ fill: "#c8c4d1", fontSize: 11 }} />
                        <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fill: "#aaa5b5", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#17151e", border: "1px solid #393544", color: "#f5f4fa" }} />
                        <Legend />
                        <Bar dataKey="Accuracy" fill="#7775f5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="F1 score" fill="#c06bea" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {healthLabelDistribution.some((item) => item["Class 0"] || item["Class 1"]) && (
                  <div className="chart-panel">
                    <h4>Health label counts in this dataset</h4>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={healthLabelDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                        <XAxis dataKey="target" tick={{ fill: "#c8c4d1", fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#aaa5b5", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#17151e", border: "1px solid #393544", color: "#f5f4fa" }} />
                        <Legend />
                        <Bar dataKey="Class 0" fill="#68758f" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Class 1" fill="#a96cea" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="chart-caption">Counts of the dataset’s encoded classes; these are not diagnostic rates.</p>
                  </div>
                )}

                {stressDistribution.length > 0 && (
                  <div className="chart-panel">
                    <h4>Stress_Level distribution in this dataset</h4>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={stressDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                        <XAxis dataKey="level" tick={{ fill: "#c8c4d1", fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#aaa5b5", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#17151e", border: "1px solid #393544", color: "#f5f4fa" }} />
                        <Bar dataKey="count" name="Responses" fill="#56b6c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="chart-caption">Counts of Stress_Level values in the uploaded dataset; these are not diagnoses.</p>
                  </div>
                )}
                {result.rows && (
                  <p className="result-note">
                    Trained using <b>{result.rows}</b> rows and <b>{result.features_used?.length || features.length}</b> encoded feature(s).
                  </p>
                )}
              </>
            )}
          </section>
        </div>

      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);









