import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Activity, Settings, RefreshCw, Table as TableIcon, LineChart as LineChartIcon, Download, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';

interface DailyData {
  fecha: string;
  temp_promedio: number;
  temp_min: number;
  temp_max: number;
  lecturas: number;
}

interface HourlyData {
  fecha: string;
  hora: number;
  minuto?: number;
  temp_promedio: number;
  temp_min: number;
  temp_max: number;
  lecturas?: number;
}

interface AggregatedPoint {
  timeLabel: string;
  displayTime: string;
  hora: number;
  minuto?: number;
  temp_promedio: number;
  temp_min: number;
  temp_max: number;
  lecturas?: number;
}

const getTemperatureColor = (temp: number) => {
  if (temp < 20) return 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-300';
  if (temp <= 30) return 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-300';
  return 'text-red-600 bg-red-50 border-red-200 hover:border-red-300 animate-pulse';
};

const getTemperatureHex = (temp: number) => {
  if (temp < 20) return '#2563eb';
  if (temp <= 30) return '#d97706';
  return '#dc2626';
};

export const TemperaturePage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.rol === 'admin';

  const [selectedDay, setSelectedDay] = useState<string>('');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [granularData, setGranularData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh interval in minutes (0 = manual)
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Modo de visualización para la sección inferior: 'chart' o 'table'
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const fetchData = async () => {
    try {
      const resTemp = await fetch('http://localhost:3000/api/dashboard/temperatura', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resTemp.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const dataTemp = await resTemp.json();

      let granular: HourlyData[] = dataTemp.porHora || [];

      if (isAdmin) {
        const resDetail = await fetch('http://localhost:3000/api/dashboard/temperatura-detallada', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resDetail.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        const dataDetail = await resDetail.json();
        if (dataDetail.por30Min) {
          granular = dataDetail.por30Min;
        }
      }

      setDailyData(dataTemp.porDia || []);
      setGranularData(granular);

      if (!selectedDay && dataTemp.porDia && dataTemp.porDia.length > 0) {
        setSelectedDay(new Date(dataTemp.porDia[0].fecha).toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error fetching temperature data', error);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, isAdmin]);

  useEffect(() => {
    if (refreshInterval > 0 && token) {
      const intervalId = setInterval(fetchData, refreshInterval * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, token]);

  const selectedDayInfo = useMemo(() => {
    return dailyData.find(d => new Date(d.fecha).toISOString().split('T')[0] === selectedDay) || dailyData[0];
  }, [dailyData, selectedDay]);

  const filteredGranularData = useMemo(() => {
    if (!selectedDay) return [];
    return granularData.filter(d => new Date(d.fecha).toISOString().split('T')[0] === selectedDay);
  }, [granularData, selectedDay]);

  const displayedGranularData = useMemo<AggregatedPoint[]>(() => {
    if (!filteredGranularData || filteredGranularData.length === 0) return [];

    if (refreshInterval === 30) {
      return filteredGranularData.map(d => {
        const horaStr = d.hora.toString().padStart(2, '0');
        const minStr = (d.minuto !== undefined ? d.minuto : 0).toString().padStart(2, '0');
        return {
          timeLabel: `${horaStr}:${minStr}`,
          displayTime: `${horaStr}:${minStr} hs`,
          hora: d.hora,
          minuto: d.minuto ?? 0,
          temp_promedio: Number(d.temp_promedio),
          temp_min: Number(d.temp_min),
          temp_max: Number(d.temp_max),
          lecturas: d.lecturas || 1
        };
      });
    }

    // Intervalo en horas: 60 (1h), 120 (2h), 240 (4h)
    const hoursStep = refreshInterval === 60 ? 1 : refreshInterval === 120 ? 2 : 4;

    // Agrupamos en bloques de horas
    const groups: { [key: number]: HourlyData[] } = {};

    filteredGranularData.forEach(item => {
      const block = Math.floor(item.hora / hoursStep) * hoursStep;
      if (!groups[block]) {
        groups[block] = [];
      }
      groups[block].push(item);
    });

    // Ordenar bloques de forma descendente (más reciente primero)
    const sortedBlocks = Object.keys(groups)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedBlocks.map(blockHour => {
      const items = groups[blockHour];
      // Promedio en base a cada cálculo de 30 minutos que entre en este intervalo
      const sumAvg = items.reduce((acc, curr) => acc + Number(curr.temp_promedio), 0);
      const avg = Number((sumAvg / items.length).toFixed(1));
      const min = Math.min(...items.map(i => Number(i.temp_min)));
      const max = Math.max(...items.map(i => Number(i.temp_max)));
      const totalLecturas = items.reduce((acc, curr) => acc + (curr.lecturas || 1), 0);

      const startStr = blockHour.toString().padStart(2, '0');
      const timeLabel = `${startStr}:00`;
      let displayTime = `${startStr}:00 hs`;
      if (hoursStep > 1) {
        const endHour = (blockHour + hoursStep - 1).toString().padStart(2, '0');
        displayTime = `${startStr}:00 - ${endHour}:59 hs`;
      }

      return {
        timeLabel,
        displayTime,
        hora: blockHour,
        minuto: 0,
        temp_promedio: avg,
        temp_min: min,
        temp_max: max,
        lecturas: totalLecturas
      };
    });
  }, [filteredGranularData, refreshInterval]);

  const chartData = useMemo(() => {
    return displayedGranularData.map(d => ({
      time: d.timeLabel,
      temp: d.temp_promedio,
      temp_min: d.temp_min,
      temp_max: d.temp_max
    })).reverse();
  }, [displayedGranularData]);

  const chartColor = getTemperatureHex(selectedDayInfo?.temp_promedio || 25);

  // Función para exportar los datos filtrados del día seleccionado en formato CSV
  const handleExportCSV = () => {
    if (displayedGranularData.length === 0) return;

    const headers = ['Fecha', 'Intervalo', 'Temperatura Promedio (°C)', 'Mínima (°C)', 'Máxima (°C)'];
    const rows = displayedGranularData.map(d => [
      new Date(selectedDay).toLocaleDateString('es-ES'),
      d.displayTime,
      d.temp_promedio,
      d.temp_min,
      d.temp_max
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historico_temperatura_${selectedDay}_${refreshInterval}min.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && dailyData.length === 0) {
    return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Thermometer className="text-indigo-500 h-7 w-7 sm:h-8 sm:w-8" />
            Módulo de Temperatura
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            Monitoreo detallado diario y análisis {isAdmin ? `(cada ${refreshInterval === 60 ? '1 hora' : refreshInterval === 120 ? '2 horas' : refreshInterval === 240 ? '4 horas' : '30 min'})` : 'por horas'}.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-sm">
            <Settings className="w-5 h-5 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium">Auto-Refresco e Intervalo</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-sm outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value={30}>Cada 30 minutos</option>
                <option value={60}>Cada hora</option>
                <option value={120}>Cada 2 horas</option>
                <option value={240}>Cada 4 horas</option>
              </select>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 font-medium">Última act.</span>
              <span className="text-slate-700">{lastRefreshed.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
            </div>
            <button
              onClick={fetchData}
              className="ml-2 p-2 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors cursor-pointer"
              title="Refrescar ahora"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {dailyData.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500">
          No hay datos de temperatura registrados.
        </div>
      ) : (
        <>
          {/* Tarjetas de Resumen Diario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {dailyData.slice(0, 7).map((data) => {
              const dateStr = new Date(data.fecha).toISOString().split('T')[0];
              const isSelected = selectedDay === dateStr;
              const displayDay = new Date(data.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02] sm:scale-105 z-10' : 'hover:scale-[1.01]'
                  } ${getTemperatureColor(data.temp_promedio)}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-base sm:text-lg font-bold capitalize">{displayDay}</h3>
                    <Activity className="opacity-70 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs sm:text-sm opacity-80 font-medium mb-1">Promedio</p>
                      <p className="text-3xl sm:text-4xl font-black tracking-tight">{data.temp_promedio}°C</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm opacity-80 font-medium mb-1">Máxima</p>
                      <p className="text-base sm:text-lg font-bold">{data.temp_max}°C</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sección de Detalle del Histórico */}
          <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Detalle del histórico: <span className="text-indigo-600">{new Date(selectedDay).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Variación {
                    refreshInterval === 30 ? 'cada 30 minutos' :
                    refreshInterval === 60 ? 'cada hora (promedio de bloques de 30 min)' :
                    refreshInterval === 120 ? 'cada 2 horas (promedio de bloques de 30 min)' :
                    'cada 4 horas (promedio de bloques de 30 min)'
                  } de temperatura en el cuarto de servidores
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selectedDayInfo && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-medium">
                      Mín: <strong className="text-slate-800">{selectedDayInfo.temp_min}°C</strong>
                    </span>
                    <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-medium">
                      Prom: <strong className="text-slate-800">{selectedDayInfo.temp_promedio}°C</strong>
                    </span>
                    <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-medium">
                      Máx: <strong className="text-slate-800">{selectedDayInfo.temp_max}°C</strong>
                    </span>
                  </div>
                )}

                {/* Switcher para cambiar entre Vista Gráfica y Tabla */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('chart')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'chart' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LineChartIcon className="w-3.5 h-3.5" />
                    Gráfico
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    Tabla
                  </button>
                </div>

                {/* Botón para exportar en CSV */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  title="Exportar a CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  CSV
                </button>
              </div>
            </div>

            {/* Renderizado Condicional: Gráfico o Tabla */}
            {viewMode === 'chart' ? (
              <div className="h-64 sm:h-80 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart key={selectedDay} data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} unit="°C" domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                        formatter={(value: any) => [`${value}°C`, 'Temperatura']}
                      />
                      <Line
                        type="monotone"
                        dataKey="temp"
                        stroke={chartColor}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: chartColor }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: chartColor }}
                        animationDuration={600}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No hay datos granulares para este día.
                  </div>
                )}
              </div>
            ) : (
              /* VISTA EN TABLA DE AUDITORÍA DETALLADA */
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                      <th className="p-3.5 pl-4">Hora / Intervalo</th>
                      <th className="p-3.5">Temperatura Promedio</th>
                      <th className="p-3.5">Mínima</th>
                      <th className="p-3.5">Máxima</th>
                      <th className="p-3.5 pr-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {displayedGranularData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                          No hay registros disponibles para el día seleccionado.
                        </td>
                      </tr>
                    ) : (
                      displayedGranularData.map((row, index) => {
                        return (
                          <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3.5 pl-4 font-mono text-xs text-slate-600 font-bold">{row.displayTime}</td>
                            <td className="p-3.5 font-bold text-slate-800">{row.temp_promedio}°C</td>
                            <td className="p-3.5 text-slate-500">{row.temp_min}°C</td>
                            <td className="p-3.5 text-slate-500">{row.temp_max}°C</td>
                            <td className="p-3.5 pr-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                row.temp_promedio >= 30
                                  ? 'bg-red-100 text-red-700'
                                  : row.temp_promedio >= 20
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {row.temp_promedio >= 30 ? 'Alto / Crítico' : row.temp_promedio >= 20 ? 'Normal' : 'Bajo / Frio'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
