import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Thermometer,
  Activity,
  Info,
  X,
  LineChart,
  Server,
  ThermometerSnowflake,
  Droplets,
  ChevronRight,
  RefreshCw,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const API_BASE = 'http://localhost:3000';

// ── Helpers de color ────────────────────────────────────────────────────────

interface TempStyle {
  card: string;       // clases para tarjeta (bg + border + text)
  badge: string;      // clases para el badge de estado
  label: string;      // texto del estado
  hex: string;        // color hex para Recharts
}

function getTempStyle(temp: number): TempStyle {
  if (temp < 20) return {
    card:  'bg-blue-50  border-blue-200  text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Frío',
    hex:   '#2563eb',
  };
  if (temp < 24) return {
    card:  'bg-teal-50  border-teal-200  text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    label: 'Normal',
    hex:   '#0d9488',
  };
  if (temp < 27) return {
    card:  'bg-amber-50  border-amber-200  text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Caliente',
    hex:   '#d97706',
  };
  return {
    card:  'bg-red-50  border-red-200  text-red-700',
    badge: 'bg-red-100 text-red-700',
    label: 'Peligro',
    hex:   '#dc2626',
  };
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ResumenData {
  actual: {
    temperatura: number;
    humedad: number;
    fecha_hora: string;
    dispositivo: string;
  } | null;
  ultimas24h: {
    total_lecturas: number;
    temp_promedio: number;
    temp_max: number;
    temp_min: number;
  };
}

interface DailyData {
  fecha: string;
  temp_promedio: number;
  temp_min: number;
  temp_max: number;
  lecturas: number;
}

interface Prediccion {
  hora: string;
  temperatura_esperada: number;
  alerta: boolean;
}

// ── Componente principal ─────────────────────────────────────────────────────

export const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [resumen, setResumen]       = useState<ResumenData | null>(null);
  const [dailyData, setDailyData]   = useState<DailyData[]>([]);
  const [prediccion, setPrediccion] = useState<Prediccion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [showPredictionInfo, setShowPredictionInfo] = useState(false);

  const fetchAll = async () => {
    if (!token) return;
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resResumen, resDashboard, resPrediccion] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/resumen`,     { headers }),
        fetch(`${API_BASE}/api/dashboard/temperatura`, { headers }),
        fetch(`${API_BASE}/api/prediccion`,            { headers }),
      ]);

      if (resResumen.status === 401 || resDashboard.status === 401 || resPrediccion.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!resResumen.ok || !resDashboard.ok || !resPrediccion.ok) {
        throw new Error('Error al obtener datos del servidor');
      }

      const [dataResumen, dataDashboard, dataPrediccion] = await Promise.all([
        resResumen.json(),
        resDashboard.json(),
        resPrediccion.json(),
      ]);

      setResumen(dataResumen);
      setDailyData(dataDashboard.porDia || []);
      setPrediccion(dataPrediccion.predicciones || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('No se pudo conectar al servidor. Verifica que el backend esté en ejecución.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  // ── Estado de carga ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

  // ── Datos derivados ────────────────────────────────────────────────────────

  const tempActual   = resumen?.actual?.temperatura ?? null;
  const humActual    = resumen?.actual?.humedad ?? null;
  const dispositivo  = resumen?.actual?.dispositivo ?? '—';
  const stats24h     = resumen?.ultimas24h;
  const ultimas7dias = dailyData.slice(0, 7);

  const tempStyle = tempActual !== null ? getTempStyle(tempActual) : null;

  // Tiempo relativo de la última lectura
  const tiempoDesde = (fechaISO: string) => {
    const diff = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 1000);
    if (diff < 60)  return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    return `hace ${Math.floor(diff / 3600)}h`;
  };

  // Datos para la gráfica de predicción
  const chartData = prediccion.map(p => ({
    hora: p.hora,
    temp: p.temperatura_esperada,
    alerta: p.alerta,
  }));

  // Horas con alerta para colorear la zona de peligro
  const alertThreshold = 27;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <LayoutDashboard className="text-indigo-500 h-7 w-7 sm:h-8 sm:w-8" />
            Dashboard Principal
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Bienvenido, {user?.username}. Resumen del cuarto de servidores.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </header>

      {/* Banner de error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <X className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tarjeta hero: Temperatura actual ─────────────────────────────── */}
      <div className={`rounded-2xl border p-5 sm:p-6 transition-all ${tempStyle?.card ?? 'bg-slate-50 border-slate-200 text-slate-700'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Icono grande con tamaño según temperatura */}
            <div className="p-4 bg-white/70 backdrop-blur rounded-2xl shadow-sm">
              <Thermometer
                className={`${
                  tempActual !== null && tempActual >= 27
                    ? 'animate-pulse'
                    : ''
                }`}
                style={{ width: 40, height: 40, color: tempStyle?.hex ?? '#64748b' }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold opacity-70 uppercase tracking-wide">Temperatura Actual</p>
              <div className="flex items-end gap-2 mt-0.5">
                {tempActual !== null ? (
                  <span className="text-5xl sm:text-6xl font-black tracking-tight">{tempActual}°C</span>
                ) : (
                  <span className="text-4xl font-black text-slate-400">—</span>
                )}
                {tempStyle && (
                  <span className={`mb-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${tempStyle.badge}`}>
                    {tempStyle.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta-datos */}
          <div className="flex flex-wrap sm:flex-col gap-3 sm:gap-2 text-sm">
            {humActual !== null && (
              <div className="flex items-center gap-1.5 opacity-80">
                <Droplets className="w-4 h-4" />
                <span className="font-semibold">{humActual}%</span>
                <span className="opacity-70">Humedad</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 opacity-80">
              <Server className="w-4 h-4" />
              <span className="font-medium">{dispositivo}</span>
            </div>
            {resumen?.actual?.fecha_hora && (
              <div className="flex items-center gap-1.5 opacity-80">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{tiempoDesde(resumen.actual.fecha_hora)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de stats 24h */}
        {stats24h && (
          <div className="mt-4 pt-4 border-t border-current/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Promedio 24h', value: `${stats24h.temp_promedio}°C` },
              { label: 'Máxima 24h',   value: `${stats24h.temp_max}°C` },
              { label: 'Mínima 24h',   value: `${stats24h.temp_min}°C` },
              { label: 'Lecturas 24h', value: stats24h.total_lecturas?.toString() ?? '—' },
            ].map(s => (
              <div key={s.label} className="bg-white/50 backdrop-blur rounded-xl p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">{s.label}</p>
                <p className="text-xl font-black mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Últimos 7 días ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-indigo-500 w-5 h-5" />
            Promedio por día — últimos 7 días
          </h2>
          <button
            onClick={() => navigate('/temperature')}
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            Ver detalles <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {ultimas7dias.length === 0 ? (
          <div className="p-6 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-sm">
            No hay datos históricos disponibles.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {ultimas7dias.map((day) => {
              const dateStr = new Date(day.fecha).toISOString().split('T')[0];
              const style   = getTempStyle(day.temp_promedio);
              const dayName = new Date(day.fecha).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });

              return (
                <button
                  key={dateStr}
                  onClick={() => navigate('/temperature')}
                  className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 cursor-pointer ${style.card}`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide opacity-60 capitalize truncate">{dayName}</p>
                  <p className="text-2xl font-black mt-1 tracking-tight">{day.temp_promedio}°C</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] opacity-70 font-medium">
                    <span>↓ {day.temp_min}°C</span>
                    <span>↑ {day.temp_max}°C</span>
                  </div>
                  <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                    {style.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Gráfica de predicción 24h ────────────────────────────────────── */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-500 h-5 w-5" />
            Predicción Térmica — Próximas 24 horas
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPredictionInfo(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
              ¿Cómo funciona?
            </button>
            <button
              onClick={() => navigate('/temperature')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Ver detalles
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            Temperatura esperada
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 bg-red-400 inline-block border-dashed border-t-2 border-red-400" />
            Umbral de alerta (27°C)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-200 inline-block" />
            Zona de peligro
          </div>
        </div>

        {prediccion.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            No hay datos de predicción disponibles.
          </div>
        ) : (
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gradAlerta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="hora"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  interval={2}
                />
                <YAxis
                  stroke="#94a3b8"
                  unit="°C"
                  tick={{ fontSize: 11 }}
                  domain={[18, 35]}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value}°C ${props?.payload?.alerta ? '⚠️' : ''}`,
                    'Temp. Esperada',
                  ]}
                />

                {/* Línea de umbral de alerta */}
                <ReferenceLine
                  y={alertThreshold}
                  stroke="#ef4444"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: '27°C', position: 'right', fill: '#ef4444', fontSize: 11, fontWeight: 700 }}
                />

                {/* Área principal — color cambia según si hay alerta */}
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#gradNormal)"
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                  name="Temp. Esperada"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Resumen de alertas predichas */}
        {prediccion.some(p => p.alerta) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <Thermometer className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-700">Alerta térmica predicha</p>
              <p className="text-red-600 mt-0.5">
                Se esperan temperaturas ≥ 27°C en las horas:{' '}
                <strong>{prediccion.filter(p => p.alerta).map(p => p.hora).join(', ')}</strong>.
                Considera verificar la ventilación del cuarto.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── MODAL: Cómo funciona la predicción ───────────────────────────── */}
      {showPredictionInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowPredictionInfo(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Modelo Predictivo</h3>
              </div>
              <button
                onClick={() => setShowPredictionInfo(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                El sistema usa un <strong>Algoritmo Híbrido de Tendencia Lineal</strong> diseñado para
                entornos de misión crítica como cuartos de servidores.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: <LineChart className="w-4 h-4" />,
                    color: 'bg-blue-100 text-blue-600',
                    title: '1. Media Histórica (7 días)',
                    desc: 'Calcula el patrón base evaluando el comportamiento térmico promedio de cada hora durante la última semana.',
                  },
                  {
                    icon: <ThermometerSnowflake className="w-4 h-4" />,
                    color: 'bg-amber-100 text-amber-600',
                    title: '2. Inercia Térmica Inmediata',
                    desc: 'Ajusta la predicción midiendo la pendiente de calentamiento basada en las últimas 50 lecturas en tiempo real.',
                  },
                  {
                    icon: <Server className="w-4 h-4" />,
                    color: 'bg-red-100 text-red-600',
                    title: '3. Umbral Crítico Automático',
                    desc: 'Si la temperatura proyectada supera los 27.0°C el sistema alerta proactivamente para la posible activación de ventiladores de respaldo.',
                  },
                ].map(item => (
                  <div key={item.title} className="flex gap-4">
                    <div className={`shrink-0 mt-1 w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{item.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowPredictionInfo(false)}
                className="w-full sm:w-auto sm:ml-auto block px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all shadow-sm text-center cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
