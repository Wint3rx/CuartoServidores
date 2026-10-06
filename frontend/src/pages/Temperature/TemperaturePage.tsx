import { useState, useEffect, useMemo } from 'react';
import { Thermometer, Activity, Settings, RefreshCw } from 'lucide-react';
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
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [granularData, setGranularData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refresh interval in minutes (0 = manual)
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      // Fetch data for both regular and admin views (admins need both summary and granular)
      const resTemp = await fetch('http://localhost:5000/api/dashboard/temperatura', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataTemp = await resTemp.json();
      
      let granular: HourlyData[] = dataTemp.porHora || [];
      
      if (isAdmin) {
        const resDetail = await fetch('http://localhost:5000/api/dashboard/temperatura-detallada', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataDetail = await resDetail.json();
        if (dataDetail.por30Min) {
          granular = dataDetail.por30Min;
        }
      }

      setDailyData(dataTemp.porDia || []);
      setGranularData(granular);
      
      if (!selectedDay && dataTemp.porDia && dataTemp.porDia.length > 0) {
        // Seleccionamos la fecha más reciente por defecto, asumiendo que viene ordenada DESC o la formateamos
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

  const chartData = useMemo(() => {
    if (!selectedDay) return [];
    // Filtramos la data granular por el día seleccionado
    const filtered = granularData.filter(d => new Date(d.fecha).toISOString().split('T')[0] === selectedDay);
    // Formateamos para el gráfico
    return filtered.map(d => {
      const horaStr = d.hora.toString().padStart(2, '0');
      const minStr = (d.minuto !== undefined ? d.minuto : 0).toString().padStart(2, '0');
      return {
        time: `${horaStr}:${minStr}`,
        temp: d.temp_promedio
      };
    }).reverse(); // Reversamos para que vaya en orden cronológico si venía DESC del backend
  }, [granularData, selectedDay]);

  const chartColor = getTemperatureHex(selectedDayInfo?.temp_promedio || 25);

  if (loading && dailyData.length === 0) {
    return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Thermometer className="text-indigo-500 h-7 w-7 sm:h-8 sm:w-8" />
            Módulo de Temperatura
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">Monitoreo detallado diario y análisis {isAdmin ? 'granular (30 min)' : 'por horas'}.</p>
        </div>
        
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-sm">
            <Settings className="w-5 h-5 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium">Auto-Refresco</span>
              <select 
                value={refreshInterval} 
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-500"
              >
                <option value={0}>Manual</option>
                <option value={1}>Cada minuto</option>
                <option value={5}>Cada 5 min</option>
                <option value={30}>Cada 30 min</option>
              </select>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 font-medium">Última act.</span>
              <span className="text-slate-700">{lastRefreshed.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
            </div>
            <button 
              onClick={fetchData}
              className="ml-2 p-2 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {dailyData.slice(0, 7).map((data) => {
              const dateStr = new Date(data.fecha).toISOString().split('T')[0];
              const isSelected = selectedDay === dateStr;
              
              // Formatear la fecha para mostrar el día
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

          <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Detalle del histórico: <span className="text-indigo-600">{new Date(selectedDay).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Variación {isAdmin ? 'cada 30 minutos' : 'horaria'} de temperatura en el cuarto de servidores
                </p>
              </div>
              {selectedDayInfo && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
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
            </div>

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
          </div>
        </>
      )}
    </div>
  );
};

