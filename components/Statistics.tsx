import React, { useEffect, useState } from 'react';
import { getAllLaunchesForStats } from '../services/spacex';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

interface StatData {
    total: number;
    success: number;
    failed: number;
    successRate: string;
}

interface YearData {
    year: string;
    total: number;
    success: number;
    failed: number;
}

const Statistics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatData>({ total: 0, success: 0, failed: 0, successRate: '0' });
    const [yearData, setYearData] = useState<YearData[]>([]);
    const [recentTrend, setRecentTrend] = useState<YearData[]>([]);
    const [bestYear, setBestYear] = useState({ year: '', count: 0 });
    const [yearsActive, setYearsActive] = useState(0);
    const [avgPerYear, setAvgPerYear] = useState('0');

    useEffect(() => {
        const processData = async () => {
            try {
                const launches = await getAllLaunchesForStats();

                // Basic Stats
                const total = launches.length;
                const success = launches.filter(l => l.success === true).length;
                const failed = launches.filter(l => l.success === false).length;
                const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '0';

                setStats({
                    total,
                    success,
                    failed,
                    successRate: rate
                });

                // Years Processing
                const yearsMap = new Map<string, YearData>();

                launches.forEach(launch => {
                    const year = new Date(launch.date_utc).getFullYear().toString();
                    if (!yearsMap.has(year)) {
                        yearsMap.set(year, { year, total: 0, success: 0, failed: 0 });
                    }
                    const entry = yearsMap.get(year)!;
                    entry.total += 1;
                    if (launch.success) entry.success += 1;
                    else entry.failed += 1;
                });

                const sortedYears = Array.from(yearsMap.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));
                setYearData(sortedYears);

                // Recent Trend (Last 5 Years)
                const currentYear = new Date().getFullYear();
                const last5 = sortedYears.filter(y => parseInt(y.year) >= currentYear - 5);
                setRecentTrend(last5);

                // Best Year
                const max = sortedYears.reduce((prev, current) => (prev.total > current.total) ? prev : current, { year: '-', total: 0 } as YearData);
                setBestYear({ year: max.year, count: max.total });

                // Active Years & Avg
                const activeCount = sortedYears.length;
                setYearsActive(activeCount);
                setAvgPerYear(activeCount > 0 ? (total / activeCount).toFixed(1) : '0');

            } catch (error) {
                console.error("Error processing stats:", error);
            } finally {
                setLoading(false);
            }
        };

        processData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40 animate-slideUp">
                <span className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
        );
    }

    const PIE_DATA = [
        { name: 'Exitosos', value: stats.success },
        { name: 'Fallidos', value: stats.failed }
    ];
    const PIE_COLORS = ['#0bda50', '#ef4444']; // Green, Red

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20 animate-slideUp">
            <header>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Estadísticas de SpaceX</h1>
                <p className="text-slate-400">Análisis de datos y métricas de rendimiento</p>
            </header>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-blue-600 rounded-xl p-6 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-3 mb-2 text-blue-100">
                        <span className="material-symbols-outlined">bolt</span>
                        <span className="text-sm font-medium">Total Lanzamientos</span>
                    </div>
                    <span className="text-5xl font-bold text-white">{stats.total}</span>
                </div>

                {/* Success */}
                <div className="bg-green-700 rounded-xl p-6 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-3 mb-2 text-green-100">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="text-sm font-medium">Exitosos</span>
                    </div>
                    <span className="text-5xl font-bold text-white">{stats.success}</span>
                </div>

                {/* Failed */}
                <div className="bg-red-800 rounded-xl p-6 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-3 mb-2 text-red-100">
                        <span className="material-symbols-outlined">trending_down</span>
                        <span className="text-sm font-medium">Fallidos</span>
                    </div>
                    <span className="text-5xl font-bold text-white">{stats.failed}</span>
                </div>

                {/* Success Rate */}
                <div className="bg-purple-700 rounded-xl p-6 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-3 mb-2 text-purple-100">
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span className="text-sm font-medium">Tasa de Éxito</span>
                    </div>
                    <span className="text-5xl font-bold text-white">{stats.successRate}%</span>
                </div>
            </div>

            {/* Middle Section: Bar Chart & Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                    <h3 className="text-white font-serif text-lg mb-6">Lanzamientos por Año</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend />
                                <Bar dataKey="success" name="Exitosos" fill="#0bda50" barSize={8} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failed" name="Fallidos" fill="#ef4444" barSize={8} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="total" name="Total" fill="#3b82f6" barSize={8} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-white font-serif text-lg mb-6">Distribución de Resultados</h3>
                    <div className="h-[300px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={PIE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {PIE_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Custom Legend Overlay */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 mr-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[#0bda50] font-bold">Exitosos</span>
                                <span className="text-sm text-slate-400">{Math.round((stats.success / stats.total) * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-red-500 font-bold">Fallidos</span>
                                <span className="text-sm text-slate-400">{Math.round((stats.failed / stats.total) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Chart: Trend */}
            <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-serif text-lg mb-6">Tendencia de Lanzamientos (Últimos 5 Años)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={recentTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="year" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="success" name="Exitosos" stroke="#0bda50" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                    <h3 className="text-slate-200 font-medium mb-4">Mejor Año</h3>
                    <p className="text-4xl font-bold text-blue-500 mb-1">{bestYear.year}</p>
                    <p className="text-slate-400 text-sm">{bestYear.count} lanzamientos</p>
                </div>

                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                    <h3 className="text-slate-200 font-medium mb-4">Promedio por Año</h3>
                    <p className="text-4xl font-bold text-[#0bda50] mb-1">{avgPerYear}</p>
                    <p className="text-slate-400 text-sm">lanzamientos/año</p>
                </div>

                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                    <h3 className="text-slate-200 font-medium mb-4">Años Activos</h3>
                    <p className="text-4xl font-bold text-purple-500 mb-1">{yearsActive}</p>
                    <p className="text-slate-400 text-sm">años de operación</p>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
