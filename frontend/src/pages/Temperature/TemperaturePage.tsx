import { useState } from 'react';
import { Thermometer, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockDailyData = [
  { day: 'Lunes', avgTemp: 22, maxTemp: 28, minTemp: 19, date: '2023-10-02' },
  { day: 'Martes', avgTemp: 35, maxTemp: 42, minTemp: 29, date: '2023-10-03' },
  { day: 'Miércoles', avgTemp: 18, maxTemp: 20, minTemp: 15, date: '2023-10-04' },
];

const mockHourlyDataByDay: Record<string, { time: string; temp: number }[]> = {
  Lunes: [
    { time: '00:00', temp: 20 },
    { time: '04:00', temp: 19 },
    { time: '08:00', temp: 22 },
    { time: '12:00', temp: 26 },
    { time: '16:00', temp: 28 },
    { time: '20:00', temp: 24 },
    { time: '23:59', temp: 21 },
  ],
  Martes: [
    { time: '00:00', temp: 29 },
    { time: '04:00', temp: 31 },
    { time: '08:00', temp: 35 },
    { time: '12:00', temp: 40 },
    { time: '16:00', temp: 42 },
    { time: '20:00', temp: 38 },
    { time: '23:59', temp: 33 },
  ],
  Miércoles: [
    { time: '00:00', temp: 17 },
    { time: '04:00', temp: 15 },
    { time: '08:00', temp: 16 },
    { time: '12:00', temp: 19 },
    { time: '16:00', temp: 20 },
    { time: '20:00', temp: 18 },
    { time: '23:59', temp: 17 },
  ],
};

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
  const [selectedDay, setSelectedDay] = useState<string>('Lunes');

  const selectedDayInfo = mockDailyData.find((d) => d.day === selectedDay) || mockDailyData[0];
  const hourlyData = mockHourlyDataByDay[selectedDay] || [];
  const chartColor = getTemperatureHex(selectedDayInfo.avgTemp);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Thermometer className="text-indigo-500 h-7 w-7 sm:h-8 sm:w-8" />
            Módulo de Temperatura
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">Monitoreo detallado diario y análisis por horas.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {mockDailyData.map((data) => {
          const isSelected = selectedDay === data.day;
          return (
            <div
              key={data.day}
              onClick={() => setSelectedDay(data.day)}
              className={`cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:shadow-md ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02] sm:scale-105 z-10' : 'hover:scale-[1.01]'
              } ${getTemperatureColor(data.avgTemp)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg sm:text-xl font-bold">{data.day}</h3>
                <Activity className="opacity-70 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs sm:text-sm opacity-80 font-medium mb-1">Promedio</p>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight">{data.avgTemp}°C</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm opacity-80 font-medium mb-1">Máxima</p>
                  <p className="text-base sm:text-lg font-bold">{data.maxTemp}°C</p>
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
              Detalle por horas: <span className="text-indigo-600">{selectedDay}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Variación horaria de temperatura en el cuarto de servidores ({selectedDayInfo.date})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-medium">
              Mín: <strong className="text-slate-800">{selectedDayInfo.minTemp}°C</strong>
            </span>
            <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-medium">
              Prom: <strong className="text-slate-800">{selectedDayInfo.avgTemp}°C</strong>
            </span>
            <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-medium">
              Máx: <strong className="text-slate-800">{selectedDayInfo.maxTemp}°C</strong>
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={selectedDay} data={hourlyData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} unit="°C" domain={['dataMin - 3', 'dataMax + 3']} />
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
        </div>
      </div>
    </div>
  );
};
