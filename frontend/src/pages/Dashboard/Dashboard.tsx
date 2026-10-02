import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, AlertTriangle, Thermometer, Activity, Info, X, LineChart, Server, ThermometerSnowflake } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockPredictiveData = [
  { time: '10:00', real: 22, predict: 22 },
  { time: '11:00', real: 23, predict: 24 },
  { time: '12:00', real: 25, predict: 25 },
  { time: '13:00', real: null, predict: 26 },
  { time: '14:00', real: null, predict: 28 },
  { time: '15:00', real: null, predict: 31 }, // Tendencia crítica predictiva
];

export const Dashboard = () => {
  const { user } = useAuth();
  const [showPredictionInfo, setShowPredictionInfo] = useState(false);

  const statCards = [
    { title: 'Temperatura Actual', value: '25°C', icon: <Thermometer size={24} className="text-blue-500" />, color: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'Accesos Hoy', value: '14', icon: <Users size={24} className="text-emerald-500" />, color: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Alertas Activas', value: '2', icon: <AlertTriangle size={24} className="text-red-500" />, color: 'bg-red-50', border: 'border-red-100' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <LayoutDashboard className="text-indigo-500 h-7 w-7 sm:h-8 sm:w-8" />
          Dashboard Principal
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">Bienvenido de nuevo, {user?.username}. Aquí tienes un resumen del sistema.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className={`p-5 sm:p-6 rounded-2xl border ${card.border} ${card.color} shadow-sm flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300`}>
            <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">{card.title}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Predictive Analysis Chart */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-500 h-5 w-5" />
            Análisis Predictivo de Temperatura
          </h2>
          <button 
            onClick={() => setShowPredictionInfo(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors w-full sm:w-auto"
          >
            <Info className="w-4 h-4" />
            ¿Cómo funciona esto?
          </button>
        </div>
        
        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockPredictiveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" unit="°C" tick={{ fontSize: 12 }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#475569', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="real" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReal)" strokeWidth={3} name="Temp. Real" />
              <Area type="monotone" strokeDasharray="5 5" dataKey="predict" stroke="#ef4444" fillOpacity={1} fill="url(#colorPredict)" strokeWidth={2} name="Temp. Predictiva" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prediction Info Modal */}
      {showPredictionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  Modelo Predictivo
                </h3>
              </div>
              <button 
                onClick={() => setShowPredictionInfo(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                El sistema utiliza un <strong>Algoritmo Híbrido de Tendencia Lineal</strong> diseñado específicamente para entornos de misión crítica como cuartos de servidores, previniendo riesgos térmicos antes de que ocurran.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <LineChart className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm sm:text-base">1. Media Histórica (7 días)</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Calcula el patrón base evaluando el comportamiento térmico promedio de cada hora durante la última semana.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <ThermometerSnowflake className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm sm:text-base">2. Inercia Térmica Inmediata</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Ajusta la predicción midiendo la pendiente térmica (velocidad de calentamiento) basada en las últimas 50 lecturas en tiempo real.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <Server className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm sm:text-base">3. Umbral Crítico Automático</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Si la temperatura proyectada supera los <strong className="text-red-600">27.0°C</strong>, el sistema alerta proactivamente para la posible activación de ventiladores de respaldo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowPredictionInfo(false)}
                className="w-full sm:w-auto sm:ml-auto block px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all shadow-sm text-center"
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
