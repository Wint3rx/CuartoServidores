import { useState } from 'react';
import { 
  Users, 
  Clock, 
  Fingerprint, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  ScanFace, 
  Mail, 
  Phone, 
  Building2, 
  KeyRound, 
  Calendar, 
  BadgeCheck,
  Server,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface UserDetail {
  id: string;
  dbId: number;
  nombre: string;
  email: string;
  telefono: string;
  departamento: string;
  puesto: string;
  rol: string;
  faceId: number | null;
  nivelAcceso: string;
  activo: boolean;
  metodosAutorizados: string[];
  creadoEn: string;
  dispositivosAutorizados: string[];
  totalAccesosMes: number;
}

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  time: string;
  status: 'granted' | 'denied';
  metodo: 'rostro' | 'codigo';
  dispositivo: string;
  imgUrl: string;
  observaciones?: string;
  userDetail?: UserDetail;
}

const mockAccessLogs: AccessLog[] = [
  { 
    id: '1', 
    userId: 'USR-001', 
    userName: 'Ing. Carlos Mendoza',
    time: '2023-10-02 08:30:15', 
    status: 'granted', 
    metodo: 'rostro',
    dispositivo: 'esp32-cam-entrada',
    imgUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    observaciones: 'Reconocimiento facial validado por modelo ESP-WHO',
    userDetail: {
      id: 'USR-001',
      dbId: 1,
      nombre: 'Ing. Carlos Mendoza',
      email: 'cmendoza@empresa.com',
      telefono: '+502 4521-8890',
      departamento: 'Infraestructura & Cloud',
      puesto: 'Administrador de Datacenter',
      rol: 'admin',
      faceId: 1,
      nivelAcceso: 'Nivel 3 (Acceso 24/7 Crítico)',
      activo: true,
      metodosAutorizados: ['Reconocimiento Facial (ESP-WHO)', 'PIN Numérico de Emergencia'],
      creadoEn: '15 de Agosto, 2023',
      dispositivosAutorizados: ['esp32-cam-entrada', 'esp32-principal'],
      totalAccesosMes: 48
    }
  },
  { 
    id: '2', 
    userId: 'USR-042', 
    userName: 'Lic. Ana Morales',
    time: '2023-10-02 10:15:02', 
    status: 'granted', 
    metodo: 'codigo',
    dispositivo: 'esp32-principal',
    imgUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    observaciones: 'PIN numérico verificado contra hash bcrypt',
    userDetail: {
      id: 'USR-042',
      dbId: 2,
      nombre: 'Lic. Ana Morales',
      email: 'amorales@empresa.com',
      telefono: '+502 5590-1234',
      departamento: 'Redes y Ciberseguridad',
      puesto: 'Especialista de Conectividad',
      rol: 'operador_ti',
      faceId: 2,
      nivelAcceso: 'Nivel 2 (Horario Laboral 07:00 - 19:00)',
      activo: true,
      metodosAutorizados: ['Código PIN Hash', 'Reconocimiento Facial'],
      creadoEn: '01 de Septiembre, 2023',
      dispositivosAutorizados: ['esp32-cam-entrada', 'esp32-principal'],
      totalAccesosMes: 22
    }
  },
  { 
    id: '3', 
    userId: 'UNKNOWN', 
    userName: 'Sujeto No Identificado',
    time: '2023-10-02 14:05:59', 
    status: 'denied', 
    metodo: 'rostro',
    dispositivo: 'esp32-cam-entrada',
    imgUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    observaciones: 'Similitud biométrica por debajo del umbral de tolerancia. Acceso bloqueado automáticamente.'
  },
];

export const AccessLogs = () => {
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-indigo-500 h-7 w-7 sm:h-8 sm:w-8" />
            Registro de Accesos
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            Historial fotográfico y temporal de ingresos al cuarto de servidores. Haz clic en cualquier usuario para consultar su ficha técnica y credenciales.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium shrink-0">
          <Eye className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Haz clic en un registro para ver detalles</span>
          <span className="sm:hidden">Selecciona para detalles</span>
        </div>
      </header>

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">Fotografía Capturada</th>
                <th className="p-4 font-semibold text-sm">Identificación / Usuario</th>
                <th className="p-4 font-semibold text-sm">Método & Dispositivo</th>
                <th className="p-4 font-semibold text-sm">Hora Exacta</th>
                <th className="p-4 font-semibold text-sm">Estado</th>
                <th className="p-4 font-semibold text-sm text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockAccessLogs.map((log) => (
                <tr 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="relative inline-block">
                      <img 
                        src={log.imgUrl} 
                        alt="Captura de acceso" 
                        className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200 group-hover:border-indigo-400 transition-colors"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        log.status === 'granted' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Fingerprint className="text-slate-400 group-hover:text-indigo-600 w-4 h-4 transition-colors" />
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {log.userId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{log.userName}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {log.metodo === 'rostro' ? <ScanFace className="w-3 h-3 text-indigo-500" /> : <KeyRound className="w-3 h-3 text-amber-500" />}
                        {log.metodo === 'rostro' ? 'Biométrico Facial' : 'Código PIN'}
                      </span>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{log.dispositivo}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="text-slate-400 w-4 h-4" />
                      <span className="text-slate-600 text-sm">{log.time}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
                      log.status === 'granted' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {log.status === 'granted' ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Autorizado
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Denegado
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition-all"
                    >
                      Ver Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Usuario */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Header del Modal */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${selectedLog.status === 'granted' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                  {selectedLog.status === 'granted' ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {selectedLog.userDetail ? 'Ficha de Usuario Autorizado' : 'Registro de Acceso No Autorizado'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID Registro: #{selectedLog.id} • Cuarto de Servidores UMG
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Tarjeta de Encabezado de Usuario */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/80">
                <img 
                  src={selectedLog.imgUrl} 
                  alt={selectedLog.userName} 
                  className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-indigo-100 shrink-0"
                />
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-2xl font-bold text-slate-800">{selectedLog.userName}</h4>
                    {selectedLog.userDetail?.activo && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <BadgeCheck className="w-3 h-3" /> Credencial Activa
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-indigo-600">
                    {selectedLog.userDetail?.puesto || 'Identidad no vinculada en base de datos'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                      ID: <strong className="text-slate-700">{selectedLog.userId}</strong>
                    </span>
                    {selectedLog.userDetail && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {selectedLog.userDetail.departamento}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Si es un usuario desconocido */}
              {!selectedLog.userDetail ? (
                <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-red-700">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Alerta de Seguridad: Sujeto no registrado
                  </div>
                  <p className="text-sm text-red-700">
                    El sistema de reconocimiento facial del hardware ESP32-CAM procesó la imagen del sujeto pero no coincidió con ningún <code className="font-mono bg-red-100 px-1 py-0.5 rounded text-xs">face_id</code> registrado en la base de datos de usuarios autorizados.
                  </p>
                  <div className="text-xs bg-white/70 p-3 rounded-xl border border-red-200 space-y-1">
                    <p><strong>Observación:</strong> {selectedLog.observaciones}</p>
                    <p><strong>Dispositivo receptor:</strong> {selectedLog.dispositivo}</p>
                    <p><strong>Hora exacta:</strong> {selectedLog.time}</p>
                  </div>
                </div>
              ) : (
                /* Datos completos del usuario (Base de datos + Empresa) */
                <div className="space-y-6">
                  {/* Grid de Atributos de Base de Datos */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Atributos en Base de Datos (Tabla <code className="text-indigo-600 font-mono">usuarios</code>)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-400 font-medium block">ID Base de Datos</span>
                        <span className="text-base font-bold text-slate-800">#{selectedLog.userDetail.dbId}</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-400 font-medium block">Rol del Sistema</span>
                        <span className="text-base font-bold text-slate-800 font-mono text-indigo-600">{selectedLog.userDetail.rol}</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-400 font-medium block">Biometría (face_id)</span>
                        <span className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                          <ScanFace className="w-4 h-4 text-emerald-500" />
                          #{selectedLog.userDetail.faceId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Información Corporativa & Permisos */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Privilegios de Acceso al Cuarto de Servidores
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                          <ShieldCheck className="w-4 h-4 text-indigo-500" />
                          Nivel de Autorización
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedLog.userDetail.nivelAcceso}
                        </p>
                        <div className="text-xs text-slate-500">
                          Total ingresos este mes: <strong className="text-indigo-600">{selectedLog.userDetail.totalAccesosMes} accesos</strong>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                          <KeyRound className="w-4 h-4 text-indigo-500" />
                          Métodos Habilitados
                        </div>
                        <ul className="text-xs space-y-1.5 text-slate-600">
                          {selectedLog.userDetail.metodosAutorizados.map((metodo, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              {metodo}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Contacto y Trazabilidad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <h6 className="text-xs font-semibold text-slate-500">Contacto Directo</h6>
                      <div className="text-xs space-y-2 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedLog.userDetail.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedLog.userDetail.telefono}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <h6 className="text-xs font-semibold text-slate-500">Dispositivos y Alta</h6>
                      <div className="text-xs space-y-2 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Server className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedLog.userDetail.dispositivosAutorizados.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Alta: {selectedLog.userDetail.creadoEn}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalle de este evento específico */}
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/80">
                    <h6 className="text-xs font-bold text-indigo-900 mb-1">Evento de Acceso Actual</h6>
                    <p className="text-xs text-indigo-700">
                      Ingreso registrado el <strong>{selectedLog.time}</strong> vía <strong>{selectedLog.metodo}</strong> mediante <strong>{selectedLog.dispositivo}</strong>. {selectedLog.observaciones}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

