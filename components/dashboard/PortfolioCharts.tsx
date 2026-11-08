"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface Property {
  id: string;
  name: string;
  price: string;
  status: string;
  type: string;
  expenses?: {
    maintenance?: string;
    taxes?: string;
    insurance?: string;
    utilities?: string;
    loanEMI?: string;
    managementFees?: string;
    other?: string;
  };
}

interface Land {
  id: string;
  name: string;
  profit: string;
  crop: string;
  area: string;
  expenses?: {
    seeds?: string;
    labor?: string;
    equipment?: string;
    fertilizers?: string;
    pesticides?: string;
    irrigation?: string;
    taxes?: string;
    insurance?: string;
    other?: string;
  };
}

interface PortfolioChartsProps {
  properties: Property[];
  lands: Land[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const parseCurrency = (value?: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
};

export function RealEstateRevenueChart({
  properties,
}: Omit<PortfolioChartsProps, "lands">) {
  const data = properties
    .map((p) => ({
      name: p.name || "Property",
      revenue: parseCurrency(p.price),
    }))
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No properties available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 60}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          opacity={0.2}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: "#111111",
            border: "1px solid #333333",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#fff",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          }}
          itemStyle={{ color: "#fff" }}
          formatter={(value: number | string | undefined) => [
            `$${Number(value || 0).toLocaleString()}`,
            "Monthly Revenue",
          ]}
        />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AgricultureRevenueChart({
  lands,
}: Omit<PortfolioChartsProps, "properties">) {
  const data = lands
    .map((l) => ({
      name: l.name || "Land",
      // Land profit is typically annual; normalize to monthly for fair comparison.
      revenue: parseCurrency(l.profit) / 12,
    }))
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No lands available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 60}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          opacity={0.2}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: "#111111",
            border: "1px solid #333333",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#fff",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          }}
          itemStyle={{ color: "#fff" }}
          formatter={(value: number | string | undefined) => [
            `$${Number(value || 0).toLocaleString()}`,
            "Monthly Revenue",
          ]}
        />
        <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AssetDistributionChart({
  properties,
  lands,
}: PortfolioChartsProps) {
  // Group by type
  const propertyTypes = properties.reduce(
    (acc, p) => {
      const type = p.type || "Other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const landTypes = lands.reduce(
    (acc, l) => {
      const type = l.crop || "Other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = [
    ...Object.entries(propertyTypes).map(([name, value]) => ({ name, value })),
    ...Object.entries(landTypes).map(([name, value]) => ({ name, value })),
  ];

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#111111",
              border: "1px solid #333333",
              borderRadius: "12px",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 px-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OccupancyChart({ properties }: { properties: Property[] }) {
  const occupied = properties.filter((p) => p.status === "Occupied").length;
  const vacant = properties.filter((p) => p.status === "Vacant").length;
  const maintenance = properties.filter(
    (p) => p.status === "Under Maintenance"
  ).length;

  const data = [
    { name: "Occupied", value: occupied, fill: "#10b981" },
    { name: "Vacant", value: vacant, fill: "#ef4444" },
    { name: "Maintenance", value: maintenance, fill: "#f59e0b" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-gray-500">
        No properties
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill}
                className="hover:opacity-80 transition-opacity" 
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#111111",
              border: "1px solid #333333",
              borderRadius: "12px",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueVsExpensesChart({
  properties,
  lands,
}: PortfolioChartsProps) {
  const calcExpenses = (exp?: Record<string, string | undefined>): number => {
    if (!exp) return 0;
    return Object.values(exp).reduce((sum, val) => sum + parseCurrency(val), 0);
  };

  const propertyData = properties.slice(0, 6).map((p) => ({
    name: p.name || "Property",
    revenue: parseCurrency(p.price),
    expenses: calcExpenses(p.expenses),
  }));

  const landData = lands.slice(0, 6).map((l) => ({
    name: l.name || "Land",
    // Land values are annual in source data; convert to monthly for comparability.
    revenue: parseCurrency(l.profit) / 12,
    expenses: calcExpenses(l.expenses) / 12,
  }));

  const renderPanel = (
    title: string,
    data: Array<{ name: string; revenue: number; expenses: number }>,
    accent: string,
  ) => {
    if (data.length === 0) {
      return (
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4 h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${accent}`}></span>
          {title}
        </h4>
        <ResponsiveContainer width="100%" height={data.length * 48 + 60}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 95, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.2}
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: "#111111",
                border: "1px solid #333333",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number | string | undefined) =>
                `$${Number(value || 0).toLocaleString()}`
              }
            />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingTop: "0px" }}
            />
            <Bar
              dataKey="revenue"
              fill="#10b981"
              name="Revenue"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              name="Expenses"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (propertyData.length === 0 && landData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {renderPanel("Real Estate", propertyData, "bg-blue-500")}
      {renderPanel("Agriculture", landData, "bg-green-500")}
    </div>
  );
}

export function PortfolioValueTrend() {
  // Mock trend data - in production, this would come from historical data
  const data = [
    { month: "Jan", value: 850000 },
    { month: "Feb", value: 862000 },
    { month: "Mar", value: 875000 },
    { month: "Apr", value: 890000 },
    { month: "May", value: 912000 },
    { month: "Jun", value: 925000 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#fff",
          }}
          itemStyle={{ color: "#fff" }}
          formatter={(value: number | string | undefined) => [
            `$${Number(value || 0).toLocaleString()}`,
            "Portfolio Value",
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: "#3b82f6", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
