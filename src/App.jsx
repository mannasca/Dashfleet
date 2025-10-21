import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { motion } from "framer-motion";
import { Truck, Wrench, AlertTriangle, Calendar } from "lucide-react";
import Papa from "papaparse";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import VehiclesList from "./VehiclesList";

function StatCard({ icon, title, value, dangerous }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.18 }}>
      <div className={`stat-card ${dangerous ? "danger" : ""}`}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-text">
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
        </div>
      </div>
    </motion.div>
  );
}

function ProgressBar({ value }) {
  return (
    <div
      className="progress-track"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div className="progress-fill" style={{ width: `${value}%` }}>
        <span className="progress-label">{value}%</span>
      </div>
    </div>
  );
}

function Dashboard({ vehicles }) {
  // month navigation only used for failures breakdown
  const [endMonthHealth, setEndMonthHealth] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  }); // kept for compatibility but health x-axis will remain w1..w4
  const [endMonthFailures, setEndMonthFailures] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const formatMonthLabel = (d) =>
    d.toLocaleString(undefined, { month: "short", year: "numeric" });

  const shiftHealthMonth = (n) =>
    setEndMonthHealth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + n);
      return d;
    }); // no effect on health x-axis labels

  const shiftFailuresMonth = (n) =>
    setEndMonthFailures((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + n);
      return d;
    });

  // compute current aggregate values from vehicles
  const currentAvgHealth = vehicles.length
    ? Math.round(
        vehicles.reduce((s, v) => s + Number(v.health || 0), 0) / vehicles.length
      )
    : 80;

  const currentPredictedFailures = vehicles.length
    ? vehicles.reduce((s, v) => s + Number(v.issues || 0), 0)
    : Math.max(1, Math.round((vehicles.length || 10) * 0.05));

  // Health: always four weekly buckets labeled w1..w4 — memoized so it only changes when health inputs change
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const healthTrend = useMemo(() => {
    return weeks.map((wk, idx) => {
      const noise = Math.round((Math.random() - 0.5) * 6); // +/- ~3
      const raw = currentAvgHealth + noise - (1 - idx / 3);
      let value = Math.round(raw);
      value = Math.max(50, Math.min(100, value));
      return { week: wk, value };
    });
  }, [currentAvgHealth, endMonthHealth]); // recompute only when avg health or its month changes

  // Failures: 4 weekly counts for the selected month — memoized so only this card's buttons re-generate it
  const failuresPredicted = useMemo(() => {
    const total = Math.max(0, Math.round(currentPredictedFailures));
    if (total === 0) return weeks.map((wk) => ({ week: wk, count: 0 }));

    const base = Math.floor(total / 4);
    const remainder = total - base * 4;
    const counts = [base, base, base, base];
    for (let i = 0; i < remainder; i++) counts[i % 4] += 1;

    for (let i = 0; i < 4; i++) {
      const change = Math.round((Math.random() - 0.5) * Math.min(2, counts[i]));
      if (change === 0) continue;
      const j = (i + 1) % 4;
      counts[i] = Math.max(0, counts[i] - change);
      counts[j] = counts[j] + change;
    }

    return weeks.map((wk, i) => ({ week: wk, count: counts[i] }));
  }, [currentPredictedFailures, endMonthFailures]);

  return (
    <div className="app-root">
      <header className="top-header">
        <h1>Fleet Manager Dashboard</h1>
      </header>

      <section className="stats-grid">
        {/* Link the Total Vehicles stat to the vehicles list page */}
        <Link to="/vehicles" style={{ textDecoration: "none" }}>
          <StatCard
            icon={<Truck />}
            title="Total Vehicles"
            value={vehicles.length || "—"}
          />
        </Link>

        <StatCard icon={<Wrench />} title="Active Maintenance" value="5" />
        <StatCard
          icon={<AlertTriangle />}
          title="Predicted Failures"
          value="3"
          dangerous
        />
        <StatCard icon={<Calendar />} title="Upcoming Services" value="7" />
      </section>

      <section className="charts-row">
        <div className="card chart-card">
          <div className="chart-card-header">
            <h2>Average Fleet Health</h2>
            <div className="chart-month-controls">
              <button className="chart-month-btn" onClick={() => shiftHealthMonth(-1)}>
                ◀
              </button>
              <div className="chart-month-label">
                {formatMonthLabel(endMonthHealth)}
              </div>
              <button className="chart-month-btn" onClick={() => shiftHealthMonth(1)}>
                ▶
              </button>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={healthTrend}>
                <XAxis dataKey="week" />
                <YAxis domain={[50, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-card-header">
            <h2>Predicted Failures</h2>
            <div className="chart-month-controls">
              <button className="chart-month-btn" onClick={() => shiftFailuresMonth(-1)}>
                ◀
              </button>
              <div className="chart-month-label">
                {formatMonthLabel(endMonthFailures)}
              </div>
              <button className="chart-month-btn" onClick={() => shiftFailuresMonth(1)}>
                ▶
              </button>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={failuresPredicted}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="vehicles-section">
        <h2>Vehicle Status Overview</h2>
        <div className="vehicles-grid">
          {vehicles.slice(0, 6).map((v) => (
            <motion.div
              key={v.id}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.18 }}
            >
              <div className="card vehicle-card">
                <div className="vehicle-header">
                  <h3>{v.name}</h3>
                  <div className="vehicle-meta">
                    Next Service:{" "}
                    <span className="meta-date">{v.nextService}</span>
                  </div>
                </div>

                <div className="progress-wrapper">
                  <ProgressBar value={v.health} />
                </div>

                <div className="vehicle-footer">
                  <div>
                    Health: <strong>{v.health}%</strong>
                  </div>
                  <div className="issues">
                    Issues: <strong>{v.issues}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="bottom-controls">
        <button className="primary-btn">Generate Maintenance Report</button>
      </div>
    </div>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const computeHealth = (row) => {
      const range = Number(row.range_km) || 0;
      const cap = Number(row.battery_capacity_kWh) || 0;
      const score = range
        ? Math.round(Math.min(100, (range / 500) * 100))
        : Math.round(Math.min(100, (cap / 100) * 100));
      return score;
    };

    const computeNextService = () => {
      const d = new Date();
      d.setDate(d.getDate() + Math.floor(Math.random() * 30) + 7);
      return d.toISOString().slice(0, 10);
    };

    const loadCsv = async () => {
      try {
        const res = await fetch("/electric_vehicles_spec_2025.csv.csv");
        const text = await res.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data || [];
            const mapped = rows
              .filter((r) => r.brand && r.model)
              .slice(0, 200)
              .map((r, idx) => ({
                id: idx + 1,
                name: `${r.brand} ${r.model}`,
                health: computeHealth(r),
                nextService: computeNextService(),
                issues: Math.floor(Math.random() * 4),
                raw: r,
              }));
            setVehicles(mapped);
          },
        });
      } catch (err) {
        console.error("Failed to load CSV", err);
      }
    };

    loadCsv();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard vehicles={vehicles} />} />
        <Route path="/vehicles" element={<VehiclesList vehicles={vehicles} />} />
      </Routes>
    </BrowserRouter>
  );
}