import React, { useEffect, useState } from "react";
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
  const healthTrend = [
    { day: "Mon", value: 90 },
    { day: "Tue", value: 88 },
    { day: "Wed", value: 85 },
    { day: "Thu", value: 80 },
    { day: "Fri", value: 75 },
  ];

  const failuresPredicted = [
    { name: "Engine", count: 4 },
    { name: "Brakes", count: 2 },
    { name: "Transmission", count: 1 },
  ];

  return (
    <div className="app-root">
      <header className="top-header">
        <h1>Fleet Manager Dashboard</h1>
      </header>

      <section className="stats-grid">
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
          <h2>Average Fleet Health</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={healthTrend}>
                <XAxis dataKey="day" />
                <YAxis domain={[60, 100]} />
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
          <h2>Predicted Failures</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={failuresPredicted}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
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
                    Next Service: <span className="meta-date">{v.nextService}</span>
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