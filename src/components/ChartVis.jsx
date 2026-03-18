import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

var COLORS = ["#2563eb","#059669","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#4f46e5","#15803d","#b45309"];

function ChartVis(props) {
  var c = props.data; if (!c) return null;
  var type = c.chartType || "bar", data = c.data || [], title = c.title || "";
  if (type === "pie") return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
      <ResponsiveContainer width="100%" height={280}><PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={function(e) { return e.name + " (" + e.value + ")"; }} fontSize={11}>
          {data.map(function(d, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}</Pie><Tooltip />
      </PieChart></ResponsiveContainer>
    </div>);
  if (type === "grouped_bar" && c.series) {
    var gd = (c.categories || []).map(function(cat, i) { var r = { name: cat }; (c.series || []).forEach(function(s) { r[s.name] = s.data[i] || 0; }); return r; });
    return (
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={gd}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Legend fontSize={10} />
          {(c.series || []).map(function(s, i) { return <Bar key={i} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />; })}
        </BarChart></ResponsiveContainer>
      </div>);
  }
  if (type === "line") return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
      <ResponsiveContainer width="100%" height={280}><LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart></ResponsiveContainer>
    </div>);
  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", mb: 8, textAlign: "center" }}>{title}</div>
      <ResponsiveContainer width="100%" height={280}><BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={10} angle={data.length > 5 ? -30 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 60 : 30} />
        <YAxis fontSize={10} /><Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>{data.map(function(d, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}</Bar>
      </BarChart></ResponsiveContainer>
    </div>);
}

function TableVis(props) {
  var t = props.data; if (!t) return null;
  var cols = t.columns || []; var rows = t.rows || []; var title = t.title || "";
  return (
    <div style={{ padding: 12 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 8, textAlign: "center" }}>{title}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>{cols.map(function(c, i) {
              return <th key={i} style={{ padding: "6px 10px", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", textAlign: "left", fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>{c}</th>;
            })}</tr>
          </thead>
          <tbody>{rows.map(function(row, ri) {
            return <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f8fafc" }}>{(Array.isArray(row) ? row : []).map(function(cell, ci) {
              return <td key={ci} style={{ padding: "5px 10px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>{cell}</td>;
            })}</tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

function Metric(props) {
  return (
    <div style={{ background: "white", borderRadius: 6, padding: "6px 10px", border: "1px solid #e2e8f0", flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 }}>{props.label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: props.color || "#1a365d" }}>{props.value}</div>
      {props.sub && <div style={{ fontSize: 8, color: "#94a3b8" }}>{props.sub}</div>}
    </div>
  );
}

export { ChartVis, TableVis, Metric, COLORS };
