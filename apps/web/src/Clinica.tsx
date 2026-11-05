import { FormEvent, useEffect, useId, useState } from 'react';
import { ErrorApi, llamar, type ExpedienteVista, type Resumen, type Sesion, type VacunaPendiente } from './api';
import { nombreInstitucion } from './App';
import { edad, iniciales } from './formato';
import { Hoja, type Seccion } from './Hoja';

const SECCIONES: Array<{ id: Seccion; etiqueta: string }> = [
  { id: 'resumen', etiqueta: 'Resumen' },
  { id: 'consultas', etiqueta: 'Consultas' },
  { id: 'agenda', etiqueta: 'Agenda' },
  { id: 'laboratorio', etiqueta: 'Laboratorio' },
  { id: 'crecimiento', etiqueta: 'Crecimiento' },
  { id: 'vacunas', etiqueta: 'Vacunas' },
  { id: 'odontograma', etiqueta: 'Odontograma' },
];

export function Clinica({ sesion, onSalir }: { sesion: Sesion; onSalir: () => void }) {
  const busquedaId = useId();
  const [texto, setTexto] = useState('');
  const [lista, setLista] = useState<Resumen[]>([]);
  const [pendientes, setPendientes] = useState<VacunaPendiente[]>([]);
  const [actual, setActual] = useState<ExpedienteVista | null>(null);
  const [seccion, setSeccion] = useState<Seccion>('resumen');
  const [alta, setAlta] = useState(false);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [cargando, setCargando] = useState(true);

  async function cargarLista(consulta = texto) {
    const pacientes = await llamar<Resumen[]>(`/pacientes?texto=${encodeURIComponent(consulta)}`, sesion.token);
    setLista(pacientes);
    return pacientes;
  }

  async function abrir(pacienteId: string) {
    const vista = await llamar<ExpedienteVista>(`/pacientes/${pacienteId}`, sesion.token);
    setActual(vista);
    setAlta(false);
  }

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    void Promise.all([
      llamar<Resumen[]>('/pacientes?texto=', sesion.token),
      llamar<VacunaPendiente[]>('/pacientes/vacunas-pendientes', sesion.token),
    ])
      .then(([pacientes, dosis]) => {
        if (!vigente) {
          return;
        }
        setLista(pacientes);
        setPendientes(dosis);
        setCargando(false);
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return;
        }
        setError(mensaje(fallo));
        setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [sesion.token]);

  async function buscar(evento: FormEvent) {
    evento.preventDefault();
    setError('');
    try {
      await cargarLista();
    } catch (fallo) {
      setError(mensaje(fallo));
    }
  }

  async function enviar(ruta: string, cuerpo: unknown) {
    setError('');
    setAviso('');
    setOcupado(true);
    try {
      const vista = await llamar<ExpedienteVista>(ruta, sesion.token, {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      });
      setActual(vista);
      setAviso('Quedó registrado en el expediente.');
      await cargarLista();
      setPendientes(await llamar<VacunaPendiente[]>('/pacientes/vacunas-pendientes', sesion.token));
    } catch (fallo) {
      setError(mensaje(fallo));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="consultorio">
      <header className="tope">
        <div>
          <p className="eyebrow">Historiales clínicos</p>
          <p className="lugar">{nombreInstitucion(sesion.institucionId)}</p>
        </div>
        <div className="quien">
          <span>
            {sesion.nombre}
            <small>{sesion.correo}</small>
          </span>
          <button type="button" className="fantasma" onClick={onSalir}>
            Salir
          </button>
        </div>
      </header>
      <div className="cuerpo">
        <aside className="censo">
          <div className="censo-cabeza">
            <h1>Censo</h1>
            <button type="button" className="fantasma" onClick={() => setAlta((valor) => !valor)} aria-expanded={alta}>
              {alta ? 'Cerrar' : 'Nuevo'}
            </button>
          </div>
          <form className="buscar" onSubmit={buscar}>
            <label htmlFor={busquedaId}>Buscar paciente</label>
            <div className="buscar-fila">
              <input
                id={busquedaId}
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                placeholder="Nombre o DPI"
              />
              <button type="submit">Buscar</button>
            </div>
          </form>
          {alta ? <Alta onCrear={(cuerpo) => void enviar('/pacientes', cuerpo)} ocupado={ocupado} /> : null}
          {cargando ? <p className="pista">Cargando censo…</p> : null}
          {!cargando && lista.length === 0 ? <p className="pista">No hay pacientes con ese criterio.</p> : null}
          {pendientes.length > 0 ? (
            <div className="pendientes">
              <h2>Dosis para hoy</h2>
              <ul>
                {pendientes.map((dosis) => (
                  <li key={`${dosis.pacienteId}-${dosis.codigo}`}>
                    <button type="button" className="enlace-lista" onClick={() => void abrir(dosis.pacienteId).then(() => setSeccion('vacunas'))}>
                      {dosis.apellidos}, {dosis.nombres}
                      <small>{dosis.codigo} · {dosis.proximaEn}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ul className="pacientes">
            {lista.map((paciente) => (
              <li key={paciente.pacienteId}>
                <button
                  type="button"
                  className={actual?.pacienteId === paciente.pacienteId ? 'paciente elegido' : 'paciente'}
                  aria-current={actual?.pacienteId === paciente.pacienteId ? 'true' : undefined}
                  onClick={() => void abrir(paciente.pacienteId).catch((fallo: unknown) => setError(mensaje(fallo)))}
                >
                  <span className="monograma" aria-hidden="true">
                    {iniciales(paciente.nombres, paciente.apellidos)}
                  </span>
                  <span>
                    <strong>
                      {paciente.apellidos}, {paciente.nombres}
                    </strong>
                    <small className={paciente.estado === 'archivado' ? 'sello' : ''}>{paciente.estado}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="hoja" aria-busy={ocupado}>
          {error ? (
            <p className="alerta" role="alert">
              {error}
            </p>
          ) : null}
          {aviso ? (
            <p className="ok" role="status">
              {aviso}
            </p>
          ) : null}
          {actual ? (
            <>
              <Cabecera
                expediente={actual}
                ocupado={ocupado}
                onArchivar={(motivo) => void enviar(`/pacientes/${actual.pacienteId}/archivar`, { motivo })}
              />
              <div className="pestanias" role="tablist" aria-label="Secciones del expediente">
                {SECCIONES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`tab-${item.id}`}
                    aria-selected={seccion === item.id}
                    aria-controls={`panel-${item.id}`}
                    className={seccion === item.id ? 'pestania activa' : 'pestania'}
                    onClick={() => setSeccion(item.id)}
                  >
                    {item.etiqueta}
                  </button>
                ))}
              </div>
              <div role="tabpanel" id={`panel-${seccion}`} aria-labelledby={`tab-${seccion}`}>
                <Hoja seccion={seccion} expediente={actual} ocupado={ocupado} onEnviar={enviar} />
              </div>
            </>
          ) : (
            <Vacio />
          )}
        </section>
      </div>
    </div>
  );
}

function Cabecera({
  expediente,
  onArchivar,
  ocupado,
}: {
  expediente: ExpedienteVista;
  onArchivar: (motivo: string) => void;
  ocupado: boolean;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [motivo, setMotivo] = useState('Traslado a otra institución');
  const anos = edad(expediente.paciente.fechaNacimiento);

  return (
    <header className="identidad">
      <div>
        <p className="eyebrow">Expediente · versión {expediente.version}</p>
        <h2>
          {expediente.paciente.apellidos}, {expediente.paciente.nombres}
        </h2>
        <p className="meta">
          <span>{anos}</span>
          <span>DPI {expediente.paciente.dpi}</span>
          <span>{expediente.paciente.fechaNacimiento}</span>
          {expediente.paciente.tutorNombre ? <span>Tutor {expediente.paciente.tutorNombre}</span> : null}
          <span className={expediente.estado === 'archivado' ? 'sello' : 'estado'}>{expediente.estado}</span>
        </p>
      </div>
      {expediente.estado === 'activo' ? (
        confirmar ? (
          <div className="confirmar" role="group" aria-label="Confirmar archivo">
            <p>El expediente queda cerrado. No se borra.</p>
            <label htmlFor="motivo-archivo">Motivo</label>
            <select id="motivo-archivo" value={motivo} onChange={(evento) => setMotivo(evento.target.value)}>
              <option>Traslado a otra institución</option>
              <option>Fallecimiento</option>
              <option>Alta definitiva</option>
              <option>Otro</option>
            </select>
            <button type="button" className="peligro" disabled={ocupado} onClick={() => onArchivar(motivo)}>
              Archivar
            </button>
            <button type="button" className="fantasma" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="fantasma" onClick={() => setConfirmar(true)}>
            Archivar
          </button>
        )
      ) : (
        <p className="sello grande">{expediente.motivoArchivo ?? 'Archivado'}</p>
      )}
    </header>
  );
}

function Alta({ onCrear, ocupado }: { onCrear: (cuerpo: unknown) => void; ocupado: boolean }) {
  const base = useId();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dpi, setDpi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('1990-01-01');
  const [sexo, setSexo] = useState('F');
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [codigoReferencia, setCodigoReferencia] = useState('');

  return (
    <form
      className="alta"
      onSubmit={(evento) => {
        evento.preventDefault();
        onCrear({
          nombres,
          apellidos,
          dpi,
          fechaNacimiento,
          sexo,
          tutorNombre: tutorNombre || undefined,
          tutorTelefono: tutorTelefono || undefined,
          codigoReferencia: codigoReferencia || undefined,
        });
      }}
    >
      <h2>Paciente nuevo</h2>
      <label htmlFor={`${base}-nombres`}>Nombres</label>
      <input id={`${base}-nombres`} value={nombres} onChange={(evento) => setNombres(evento.target.value)} required />
      <label htmlFor={`${base}-apellidos`}>Apellidos</label>
      <input id={`${base}-apellidos`} value={apellidos} onChange={(evento) => setApellidos(evento.target.value)} required />
      <label htmlFor={`${base}-dpi`}>DPI</label>
      <input id={`${base}-dpi`} value={dpi} onChange={(evento) => setDpi(evento.target.value)} inputMode="numeric" minLength={13} maxLength={13} required />
      <label htmlFor={`${base}-nacimiento`}>Nacimiento</label>
      <input id={`${base}-nacimiento`} type="date" value={fechaNacimiento} onChange={(evento) => setFechaNacimiento(evento.target.value)} required />
      <label htmlFor={`${base}-tutor`}>Tutor</label>
      <input id={`${base}-tutor`} value={tutorNombre} onChange={(evento) => setTutorNombre(evento.target.value)} placeholder="Si es menor de edad" />
      <label htmlFor={`${base}-tutor-tel`}>Teléfono del tutor</label>
      <input id={`${base}-tutor-tel`} value={tutorTelefono} onChange={(evento) => setTutorTelefono(evento.target.value)} />
      <label htmlFor={`${base}-ref`}>Código de referencia</label>
      <input id={`${base}-ref`} value={codigoReferencia} onChange={(evento) => setCodigoReferencia(evento.target.value)} />
      <label htmlFor={`${base}-sexo`}>Sexo</label>
      <select id={`${base}-sexo`} value={sexo} onChange={(evento) => setSexo(evento.target.value)}>
        <option value="F">F</option>
        <option value="M">M</option>
        <option value="X">X</option>
      </select>
      <button type="submit" disabled={ocupado}>
        Crear expediente
      </button>
    </form>
  );
}

function Vacio() {
  return (
    <div className="vacio">
      <p className="eyebrow">Sin expediente abierto</p>
      <h2>Elige a alguien del censo.</h2>
      <p>La hoja muestra consultas, agenda, laboratorio, crecimiento, vacunas y odontograma del mismo paciente.</p>
    </div>
  );
}

function mensaje(fallo: unknown): string {
  return fallo instanceof Error ? fallo.message : 'Error inesperado';
}
