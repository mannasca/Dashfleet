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
import EVBus from "./EVBus";
import ActiveMaintenance from "./ActiveMaintenance";
import PredictedFailures from "./PredictedFailures";
import HomePage from "./HomePage";
import Header from "./components/Header";
import MaintenanceScheduling from "./MaintenanceScheduling";

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
      // More dramatic variation - larger swings between weeks
      const noise = Math.round((Math.random() - 0.5) * 20); // +/- ~10 for more drama
      const trendDown = idx * 8; // Steeper decline each week
      const raw = currentAvgHealth + noise - trendDown;
      let value = Math.round(raw);
      value = Math.max(40, Math.min(100, value)); // Wider range (40-100 instead of 50-100)
      return { week: wk, value };
    });
  }, [currentAvgHealth, endMonthHealth]); // recompute only when avg health or its month changes

  // Failures: 4 weekly counts for the selected month — memoized so only this card's buttons re-generate it
  const failuresPredicted = useMemo(() => {
    // Use month/year as seed for consistent but different patterns per month
    const monthSeed = endMonthFailures.getFullYear() * 12 + endMonthFailures.getMonth();
    
    const total = Math.max(5, Math.round(currentPredictedFailures * 2)); // Multiply by 2 for higher numbers
    if (total === 0) return weeks.map((wk) => ({ week: wk, count: 0 }));

    // Seeded random function for consistency per month
    const seededRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Generate random but consistent patterns for each week based on month
    const counts = [];
    const avgPerWeek = Math.floor(total / 4);
    
    for (let i = 0; i < 4; i++) {
      // Each week gets a random multiplier between 0.3 and 2.5
      const randomFactor = seededRandom(monthSeed * 7 + i * 13);
      const multiplier = 0.3 + randomFactor * 2.2; // Range: 0.3 to 2.5
      let count = Math.round(avgPerWeek * multiplier);
      
      // Add some extra variation
      const extraVariation = seededRandom(monthSeed * 11 + i * 17);
      count += Math.round((extraVariation - 0.5) * 20); // +/- 10
      
      counts[i] = Math.max(5, count); // Minimum 5 to keep visible
    }

    // Normalize so total roughly matches but maintains dramatic differences
    const currentTotal = counts.reduce((sum, c) => sum + c, 0);
    if (currentTotal > 0) {
      const adjustmentFactor = total / currentTotal;
      for (let i = 0; i < 4; i++) {
        counts[i] = Math.max(5, Math.round(counts[i] * adjustmentFactor * (0.8 + seededRandom(monthSeed + i) * 0.4)));
      }
    }

    return weeks.map((wk, i) => ({ week: wk, count: counts[i] }));
  }, [currentPredictedFailures, endMonthFailures]);

  return (
    <div className="app-root">
      <Header />
      <div className="content-with-header">
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

                <Link to="/maintenance" style={{ textDecoration: "none" }}>
          <StatCard
            icon={<Wrench />}
            title="Active Maintenance"
            value={vehicles.filter((v) => v.inMaintenance).length || "0"}
          />
        </Link>
        <Link to="/failures" style={{ textDecoration: "none" }}>
          <StatCard
            icon={<AlertTriangle />}
            title="Predicted Failures"
            value={vehicles.filter((v) => v.issues > 0).length || "0"}
            dangerous
          />
        </Link>
        <Link to="/scheduling" style={{ textDecoration: "none" }}>
          <StatCard icon={<Calendar />} title="Maintenance Scheduling" value="7" />
        </Link>
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={healthTrend}>
                <XAxis dataKey="week" stroke="#999999" style={{ fontSize: '12px' }} />
                <YAxis domain={[30, 100]} stroke="#999999" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ background: '#0f0f0f', border: '2px solid #00d4ff', borderRadius: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#colorHealth)"
                  strokeWidth={4}
                  dot={{ fill: "#00d4ff", r: 6, strokeWidth: 2, stroke: "#000000" }}
                />
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#b14aff" />
                  </linearGradient>
                </defs>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={failuresPredicted}>
                <XAxis dataKey="week" stroke="#999999" style={{ fontSize: '12px' }} />
                <YAxis domain={[0, "dataMax + 10"]} stroke="#999999" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ background: '#0f0f0f', border: '2px solid #ff3366', borderRadius: '8px' }} />
                <Bar 
                  dataKey="count" 
                  radius={[10, 10, 0, 0]} 
                  fill="url(#colorFailures)"
                  animationDuration={800}
                  barSize={60}
                />
                <defs>
                  <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3366" />
                    <stop offset="100%" stopColor="#ff6b35" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="vehicles-section">
        <h2>Vehicle Status Overview</h2>
        {/* 3D vehicle preview / fleet model */}
        {/* <EVBus vehicles={vehicles} initialColor="#2b7cff" /> */}
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
              .map((r, idx) => {
                const issues = Math.floor(Math.random() * 4);
                const inMaintenance = issues > 0 && Math.random() < 0.25; // ~25% of vehicles with issues are in repair
                return {
                  id: idx + 1,
                  name: `${r.brand} ${r.model}`,
                  health: computeHealth(r),
                  nextService: computeNextService(),
                  issues,
                  inMaintenance,
                  raw: r,
                };
              });
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
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard vehicles={vehicles} />} />
        <Route path="/vehicles" element={<VehiclesList vehicles={vehicles} />} />
        <Route path="/maintenance" element={<ActiveMaintenance vehicles={vehicles} />} />
        <Route path="/failures" element={<PredictedFailures vehicles={vehicles} />} />
        <Route path="/scheduling" element={<MaintenanceScheduling vehicles={vehicles} />} />
      </Routes>
    </BrowserRouter>
  );
}