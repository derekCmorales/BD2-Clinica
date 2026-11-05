import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorApi, llamar, type ExpedienteVista, type Resumen, type Sesion, type VacunaPendiente } from './api';
import { institucion } from './App';
import { edad, esMenor, fechaLegible, fechaRelativa, hoyIso, iniciales } from './formato';
import { Hoja, type Seccion } from './Hoja';
import {
  Alerta,
  Avatar,
  Boton,
  Campo,
  DatoProtegido,
  Dialogo,
  Esqueleto,
  EtiquetaClasificacion,
  Icono,
  Insignia,
  Vacio,
  useToast,
  type NombreIcono,
} from './ui';

const SECCIONES: Array<{ id: Seccion; etiqueta: string; icono: NombreIcono; cuenta?: (e: ExpedienteVista) => number }> = [
  { id: 'resumen', etiqueta: 'Resumen', icono: 'resumen' },
  { id: 'consultas', etiqueta: 'Consultas', icono: 'estetoscopio', cuenta: (e) => e.consultas.length },
  { id: 'agenda', etiqueta: 'Agenda', icono: 'calendario', cuenta: (e) => e.citas.filter((c) => c.estado === 'programada').length },
  { id: 'laboratorio', etiqueta: 'Laboratorio', icono: 'matraz', cuenta: (e) => e.examenes.length },
  { id: 'crecimiento', etiqueta: 'Crecimiento', icono: 'grafica', cuenta: (e) => e.mediciones.length },
  { id: 'vacunas', etiqueta: 'Vacunas', icono: 'jeringa', cuenta: (e) => e.vacunas.length },
  { id: 'odontograma', etiqueta: 'Odontograma', icono: 'diente' },
];

type Filtro = 'activo' | 'archivado' | 'todos';

export function Clinica({ sesion, onSalir }: { sesion: Sesion; onSalir: () => void }) {
  const avisar = useToast();
  const lugar = institucion(sesion.institucionId);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('activo');
  const [lista, setLista] = useState<Resumen[]>([]);
  const [pendientes, setPendientes] = useState<VacunaPendiente[]>([]);
  const [actual, setActual] = useState<ExpedienteVista | null>(null);
  const [abriendo, setAbriendo] = useState<string | null>(null);
  const [seccion, setSeccion] = useState<Seccion>('resumen');
  const [alta, setAlta] = useState(false);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarLista = useCallback(
    async (consulta: string) => {
      const pacientes = await llamar<Resumen[]>(`/pacientes?texto=${encodeURIComponent(consulta)}`, sesion.token);
      setLista(pacientes);
    },
    [sesion.token],
  );

  const cargarPendientes = useCallback(async () => {
    setPendientes(await llamar<VacunaPendiente[]>('/pacientes/vacunas-pendientes', sesion.token));
  }, [sesion.token]);

  async function abrir(pacienteId: string, destino: Seccion = 'resumen') {
    setError('');
    setAbriendo(pacienteId);
    try {
      const vista = await llamar<ExpedienteVista>(`/pacientes/${pacienteId}`, sesion.token);
      setActual(vista);
      setSeccion(destino);
    } catch (fallo) {
      setError(mensaje(fallo));
    } finally {
      setAbriendo(null);
    }
  }

  // Carga inicial + búsqueda con debounce.
  useEffect(() => {
    let vigente = true;
    const espera = window.setTimeout(
      () => {
        cargarLista(texto)
          .catch((fallo: unknown) => vigente && setError(mensaje(fallo)))
          .finally(() => vigente && setCargando(false));
      },
      texto ? 250 : 0,
    );
    return () => {
      vigente = false;
      window.clearTimeout(espera);
    };
  }, [texto, cargarLista]);

  useEffect(() => {
    cargarPendientes().catch(() => undefined);
  }, [cargarPendientes]);

  async function enviar(ruta: string, cuerpo: unknown, exito = 'Quedó registrado en el expediente.'): Promise<boolean> {
    setError('');
    setOcupado(true);
    try {
      const vista = await llamar<ExpedienteVista>(ruta, sesion.token, {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      });
      setActual(vista);
      avisar(exito);
      void cargarLista(texto);
      void cargarPendientes();
      return true;
    } catch (fallo) {
      setError(mensaje(fallo));
      if (fallo instanceof ErrorApi && fallo.codigo === 'ConflictoDeConcurrencia' && actual) {
        // Recarga la versión más reciente y deja el aviso visible para que el médico sepa por qué.
        const aviso = fallo.message;
        void abrir(actual.pacienteId, seccion).then(() => setError(aviso));
      }
      return false;
    } finally {
      setOcupado(false);
    }
  }

  const visibles = useMemo(
    () => (filtro === 'todos' ? lista : lista.filter((paciente) => paciente.estado === filtro)),
    [lista, filtro],
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__izq">
          <span className="logo logo--sm">
            <Icono nombre="pulso" />
          </span>
          <span className="topbar__sep" aria-hidden="true" />
          <span className="topbar__lugar">{lugar.nombre}</span>
          <span className="solo-escritorio">
            <Insignia icono="motor">{lugar.motor}</Insignia>
          </span>
        </div>
        <div className="topbar__der">
          <div className="usuario">
            <span className="usuario__texto">
              <span>{sesion.nombre}</span>
              <small>{sesion.correo}</small>
            </span>
            <Avatar texto={inicialesDeNombre(sesion.nombre)} />
          </div>
          <Boton variante="ghost" tamano="sm" icono="salir" onClick={onSalir}>
            Salir
          </Boton>
        </div>
      </header>

      <div className={`layout${actual ? ' layout--expediente' : ''}`}>
        <aside className="censo" aria-label="Censo de pacientes">
          <div className="censo__cabeza">
            <div className="censo__titulo">
              <h2>Pacientes</h2>
              <Boton variante="primary" tamano="sm" icono="mas" onClick={() => setAlta(true)}>
                Nuevo
              </Boton>
            </div>
            <div className="input-group">
              <Icono nombre="buscar" />
              <input
                className="input"
                type="search"
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                placeholder="Buscar por nombre o DPI"
                aria-label="Buscar paciente por nombre o DPI"
              />
            </div>
            <div className="censo__filtros">
              <div className="segmented" role="radiogroup" aria-label="Estado del expediente">
                {(['activo', 'archivado', 'todos'] as const).map((opcion) => (
                  <label key={opcion}>
                    <input type="radio" name="filtro" checked={filtro === opcion} onChange={() => setFiltro(opcion)} />
                    {opcion === 'activo' ? 'Activos' : opcion === 'archivado' ? 'Archivados' : 'Todos'}
                  </label>
                ))}
              </div>
              <span className="muted num" style={{ fontSize: 'var(--text-xs)' }}>
                {visibles.length}
              </span>
            </div>
          </div>

          {pendientes.length > 0 ? (
            <details className="pendientes" open>
              <summary>
                <Icono nombre="jeringa" />
                {pendientes.length} {pendientes.length === 1 ? 'dosis pendiente' : 'dosis pendientes'}
                <Icono nombre="chevron" className="chevron" />
              </summary>
              <ul>
                {pendientes.map((dosis) => (
                  <li key={`${dosis.pacienteId}-${dosis.codigo}`}>
                    <button type="button" onClick={() => void abrir(dosis.pacienteId, 'vacunas')}>
                      <span>
                        {dosis.apellidos}, {dosis.nombres} · <span className="mono">{dosis.codigo}</span>
                      </span>
                      <small>{fechaRelativa(dosis.proximaEn)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <nav className="censo__lista" aria-label="Resultados">
            {cargando ? (
              <ul aria-busy="true">
                {[0, 1, 2, 3, 4].map((indice) => (
                  <li key={indice} className="fila-paciente">
                    <span className="avatar" />
                    <span className="fila-paciente__texto" style={{ gap: 6 }}>
                      <Esqueleto ancho="70%" />
                      <Esqueleto ancho="35%" alto={10} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : visibles.length === 0 ? (
              <Vacio icono="usuario" titulo={texto ? 'Sin coincidencias' : 'Sin pacientes'}>
                {texto ? `Nadie coincide con «${texto}».` : 'Registra el primer paciente con «Nuevo».'}
              </Vacio>
            ) : (
              <ul>
                {visibles.map((paciente) => {
                  const elegido = actual?.pacienteId === paciente.pacienteId;
                  return (
                    <li key={paciente.pacienteId}>
                      <button
                        type="button"
                        className={`fila-paciente${paciente.estado === 'archivado' ? ' fila-paciente--archivado' : ''}`}
                        aria-current={elegido ? 'true' : undefined}
                        aria-busy={abriendo === paciente.pacienteId || undefined}
                        onClick={() => void abrir(paciente.pacienteId)}
                      >
                        <Avatar texto={iniciales(paciente.nombres, paciente.apellidos)} />
                        <span className="fila-paciente__texto">
                          <strong>
                            {paciente.apellidos}, {paciente.nombres}
                          </strong>
                          <small className="mono">{paciente.pacienteId.slice(0, 8)}</small>
                        </span>
                        {paciente.estado === 'archivado' ? <Insignia>Archivado</Insignia> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>
        </aside>

        <main className="principal" aria-busy={ocupado}>
          {actual ? (
            <div className="principal__contenido" key={actual.pacienteId}>
              <div className="solo-movil">
                <Boton variante="ghost" tamano="sm" onClick={() => setActual(null)}>
                  ← Pacientes
                </Boton>
              </div>
              <Cabecera
                expediente={actual}
                ocupado={ocupado}
                onArchivar={(motivo) => enviar(`/pacientes/${actual.pacienteId}/archivar`, { motivo }, 'Expediente archivado.')}
              />
              {error ? (
                <Alerta tono="danger" titulo="No se pudo guardar" accion={<Boton variante="ghost" tamano="sm" soloIcono icono="cerrar" aria-label="Descartar" onClick={() => setError('')} />}>
                  {error}
                </Alerta>
              ) : null}
              <div>
                <div className="tabs" role="tablist" aria-label="Secciones del expediente">
                  {SECCIONES.map((item) => {
                    const cuenta = item.cuenta?.(actual);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        id={`tab-${item.id}`}
                        className="tab"
                        aria-selected={seccion === item.id}
                        aria-controls={`panel-${item.id}`}
                        tabIndex={seccion === item.id ? 0 : -1}
                        onClick={() => setSeccion(item.id)}
                        onKeyDown={(evento) => moverPestana(evento, item.id, setSeccion)}
                      >
                        <Icono nombre={item.icono} />
                        {item.etiqueta}
                        {cuenta ? <span className="tab__count">{cuenta}</span> : null}
                      </button>
                    );
                  })}
                </div>
                <div
                  role="tabpanel"
                  id={`panel-${seccion}`}
                  aria-labelledby={`tab-${seccion}`}
                  style={{ paddingTop: 'var(--space-6)' }}
                  className="aparece"
                  key={seccion}
                >
                  <Hoja seccion={seccion} expediente={actual} ocupado={ocupado} onEnviar={enviar} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bienvenida">
              {error ? <Alerta tono="danger">{error}</Alerta> : null}
              <Vacio
                icono="nota"
                titulo="Ningún expediente abierto"
                accion={
                  <Boton variante="secondary" icono="usuarioMas" onClick={() => setAlta(true)}>
                    Registrar paciente
                  </Boton>
                }
              >
                Elige un paciente de la lista para ver su historial. La pantalla es la misma en las cuatro instituciones.
              </Vacio>
            </div>
          )}
        </main>
      </div>

      <AltaPaciente
        abierto={alta}
        ocupado={ocupado}
        onCerrar={() => setAlta(false)}
        onCrear={async (cuerpo) => {
          if (await enviar('/pacientes', cuerpo, 'Expediente creado.')) {
            setAlta(false);
            setSeccion('resumen');
          }
        }}
      />
    </div>
  );
}

function moverPestana(evento: React.KeyboardEvent, actual: Seccion, elegir: (seccion: Seccion) => void) {
  const indice = SECCIONES.findIndex((item) => item.id === actual);
  let siguiente = -1;
  if (evento.key === 'ArrowRight') siguiente = (indice + 1) % SECCIONES.length;
  if (evento.key === 'ArrowLeft') siguiente = (indice - 1 + SECCIONES.length) % SECCIONES.length;
  if (evento.key === 'Home') siguiente = 0;
  if (evento.key === 'End') siguiente = SECCIONES.length - 1;
  if (siguiente < 0) return;
  evento.preventDefault();
  const destino = SECCIONES[siguiente].id;
  elegir(destino);
  document.getElementById(`tab-${destino}`)?.focus();
}

function Cabecera({
  expediente,
  onArchivar,
  ocupado,
}: {
  expediente: ExpedienteVista;
  onArchivar: (motivo: string) => Promise<boolean>;
  ocupado: boolean;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [motivo, setMotivo] = useState('Traslado a otra institución');
  const [detalle, setDetalle] = useState('');
  const { paciente } = expediente;
  const menor = esMenor(paciente.fechaNacimiento);
  const motivoFinal = motivo === 'Otro' ? detalle.trim() : motivo;

  return (
    <header className="cabecera">
      <div className="cabecera__persona">
        <Avatar texto={iniciales(paciente.nombres, paciente.apellidos)} grande />
        <div style={{ minWidth: 0 }}>
          <div className="cabecera__nombre">
            <h1 style={{ fontSize: 'var(--text-xl)' }}>
              {paciente.nombres} {paciente.apellidos}
            </h1>
            {expediente.estado === 'archivado' ? (
              <Insignia tono="neutral" icono="archivo">
                Archivado
              </Insignia>
            ) : (
              <Insignia tono="success" punto>
                Activo
              </Insignia>
            )}
            {menor ? (
              <Insignia tono="warning" icono="escudo">
                Menor de edad
              </Insignia>
            ) : null}
          </div>
          <div className="cabecera__meta">
            <span>{edad(paciente.fechaNacimiento)}</span>
            <span>{paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : 'Otro'}</span>
            <span>Nac. {fechaLegible(paciente.fechaNacimiento)}</span>
            <span>
              DPI <DatoProtegido valor={paciente.dpi} etiqueta="DPI" />
            </span>
            {paciente.tutorNombre ? <span>Tutor: {paciente.tutorNombre}</span> : null}
            <span className="num">v{expediente.version}</span>
          </div>
          {expediente.estado === 'archivado' && expediente.motivoArchivo ? (
            <p className="muted" style={{ marginTop: 6, fontSize: 'var(--text-sm)' }}>
              Motivo de archivo: {expediente.motivoArchivo}
            </p>
          ) : null}
        </div>
      </div>
      <div className="cabecera__acciones">
        {expediente.estado === 'activo' ? (
          <Boton variante="secondary" icono="archivo" onClick={() => setConfirmar(true)}>
            Archivar
          </Boton>
        ) : null}
      </div>

      <Dialogo
        abierto={confirmar}
        onCerrar={() => setConfirmar(false)}
        pequeno
        titulo="Archivar expediente"
        descripcion={`${paciente.nombres} ${paciente.apellidos} quedará en solo lectura. El historial no se borra.`}
        onEnviar={async () => {
          if (motivoFinal && (await onArchivar(motivoFinal))) setConfirmar(false);
        }}
        pie={
          <>
            <Boton variante="ghost" onClick={() => setConfirmar(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="danger" cargando={ocupado} disabled={!motivoFinal}>
              Archivar expediente
            </Boton>
          </>
        }
      >
        <div className="form-grid">
          <Campo etiqueta="Motivo">
            {(props) => (
              <select {...props} className="select" value={motivo} onChange={(evento) => setMotivo(evento.target.value)}>
                <option>Traslado a otra institución</option>
                <option>Fallecimiento</option>
                <option>Alta definitiva</option>
                <option>Otro</option>
              </select>
            )}
          </Campo>
          {motivo === 'Otro' ? (
            <Campo etiqueta="Describe el motivo">
              {(props) => <input {...props} className="input" value={detalle} onChange={(e) => setDetalle(e.target.value)} required />}
            </Campo>
          ) : null}
        </div>
      </Dialogo>
    </header>
  );
}

function AltaPaciente({
  abierto,
  onCerrar,
  onCrear,
  ocupado,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onCrear: (cuerpo: unknown) => Promise<void>;
  ocupado: boolean;
}) {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dpi, setDpi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('F');
  const [telefono, setTelefono] = useState('');
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [codigoReferencia, setCodigoReferencia] = useState('');
  const [intentado, setIntentado] = useState(false);
  const menor = fechaNacimiento ? esMenor(fechaNacimiento) : false;
  const dpiValido = /^\d{13}$/.test(dpi);
  const valido = nombres.trim() && apellidos.trim() && dpiValido && fechaNacimiento;

  function limpiar() {
    setNombres('');
    setApellidos('');
    setDpi('');
    setFechaNacimiento('');
    setSexo('F');
    setTelefono('');
    setTutorNombre('');
    setTutorTelefono('');
    setCodigoReferencia('');
    setIntentado(false);
  }

  return (
    <Dialogo
      abierto={abierto}
      onCerrar={() => {
        onCerrar();
        limpiar();
      }}
      titulo="Nuevo paciente"
      descripcion="Se crea un expediente vacío en el motor de tu institución."
      onEnviar={async () => {
        setIntentado(true);
        if (!valido) return;
        await onCrear({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          dpi,
          fechaNacimiento,
          sexo,
          telefono: telefono || undefined,
          tutorNombre: tutorNombre || undefined,
          tutorTelefono: tutorTelefono || undefined,
          codigoReferencia: codigoReferencia || undefined,
        });
        limpiar();
      }}
      pie={
        <>
          <Boton variante="ghost" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" variante="primary" cargando={ocupado}>
            Crear expediente
          </Boton>
        </>
      }
    >
      <div className="form-grid form-grid--2">
        <p className="span-2 overline" style={{ display: 'flex', justifyContent: 'space-between' }}>
          Identificación <EtiquetaClasificacion nivel="confidencial" />
        </p>
        <Campo etiqueta="Nombres" error={intentado && !nombres.trim() ? 'Requerido' : undefined}>
          {(props) => <input {...props} className="input" value={nombres} onChange={(e) => setNombres(e.target.value)} autoFocus />}
        </Campo>
        <Campo etiqueta="Apellidos" error={intentado && !apellidos.trim() ? 'Requerido' : undefined}>
          {(props) => <input {...props} className="input" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />}
        </Campo>
        <Campo etiqueta="DPI" pista="13 dígitos, sin espacios" error={intentado && !dpiValido ? 'El DPI tiene 13 dígitos' : undefined}>
          {(props) => (
            <input
              {...props}
              className="input mono"
              value={dpi}
              onChange={(e) => setDpi(e.target.value.replace(/\D/g, '').slice(0, 13))}
              inputMode="numeric"
              autoComplete="off"
            />
          )}
        </Campo>
        <Campo etiqueta="Fecha de nacimiento" error={intentado && !fechaNacimiento ? 'Requerido' : undefined}>
          {(props) => (
            <input {...props} className="input" type="date" max={hoyIso()} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
          )}
        </Campo>
        <div className="field">
          <span className="field__label" id="sexo-etiqueta">
            Sexo
          </span>
          <div className="segmented" role="radiogroup" aria-labelledby="sexo-etiqueta">
            {[
              ['F', 'Femenino'],
              ['M', 'Masculino'],
              ['X', 'Otro'],
            ].map(([valor, etiqueta]) => (
              <label key={valor}>
                <input type="radio" name="sexo" checked={sexo === valor} onChange={() => setSexo(valor)} />
                {etiqueta}
              </label>
            ))}
          </div>
        </div>
        <Campo etiqueta="Teléfono" opcional>
          {(props) => <input {...props} className="input" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />}
        </Campo>

        <p className="span-2 overline" style={{ marginTop: 8 }}>
          {menor ? 'Tutor responsable · recomendado para menores' : 'Tutor y referencia'}
        </p>
        <Campo etiqueta="Nombre del tutor" opcional pista={menor ? 'Paciente menor de edad: sus datos son restringidos' : undefined}>
          {(props) => <input {...props} className="input" value={tutorNombre} onChange={(e) => setTutorNombre(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Teléfono del tutor" opcional>
          {(props) => <input {...props} className="input" type="tel" value={tutorTelefono} onChange={(e) => setTutorTelefono(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Código de referencia" opcional pista="Si viene referido de otra institución" className="span-2">
          {(props) => <input {...props} className="input" value={codigoReferencia} onChange={(e) => setCodigoReferencia(e.target.value)} />}
        </Campo>
      </div>
    </Dialogo>
  );
}

function mensaje(fallo: unknown): string {
  return fallo instanceof Error ? fallo.message : 'Error inesperado';
}

function inicialesDeNombre(nombre: string): string {
  const partes = nombre.replace(/^(dra?|lic|licda?)\.\s+/i, '').split(/\s+/).filter(Boolean);
  return iniciales(partes[0] ?? '', partes[partes.length - 1] ?? '');
}
