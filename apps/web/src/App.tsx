import { FormEvent, useId, useState } from 'react';
import { ErrorApi, llamar, type Sesion } from './api';
import { Clinica } from './Clinica';

const INSTITUCIONES = [
  { id: 'hospital', nombre: 'Hospital general', detalle: 'Medicina interna y agenda' },
  { id: 'odontologia', nombre: 'Clínica odontológica', detalle: 'Odontograma y procedimientos' },
  { id: 'laboratorio', nombre: 'Laboratorio clínico', detalle: 'Resultados por tipo de examen' },
  { id: 'pediatrico', nombre: 'Centro pediátrico', detalle: 'Curva de crecimiento y vacunas' },
] as const;

export function App() {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion());

  function entrar(siguiente: Sesion) {
    sessionStorage.setItem('sesion', JSON.stringify(siguiente));
    setSesion(siguiente);
  }

  function salir() {
    sessionStorage.removeItem('sesion');
    setSesion(null);
  }

  if (!sesion) {
    return <Ingreso onEntrar={entrar} />;
  }

  return <Clinica sesion={sesion} onSalir={salir} />;
}

function Ingreso({ onEntrar }: { onEntrar: (sesion: Sesion) => void }) {
  const claveId = useId();
  const errorId = useId();
  const [institucionId, setInstitucionId] = useState<(typeof INSTITUCIONES)[number]['id']>('hospital');
  const [clave, setClave] = useState('demo');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const sesion = await llamar<Sesion>('/sesion', null, {
        method: 'POST',
        body: JSON.stringify({ institucionId, clave }),
      });
      onEntrar(sesion);
    } catch (fallo) {
      setError(fallo instanceof ErrorApi ? fallo.message : 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="acceso">
      <section className="acceso-marca">
        <p className="eyebrow">Bases de Datos II · URL</p>
        <h1>El expediente, en una sola hoja.</h1>
        <p>
          La misma consulta para las cuatro instituciones. El acceso elige el motor; la pantalla no cambia.
        </p>
      </section>
      <form className="acceso-panel" onSubmit={enviar}>
        <fieldset>
          <legend>Institución</legend>
          <div className="carpetas">
            {INSTITUCIONES.map((institucion) => (
              <label key={institucion.id} className={institucionId === institucion.id ? 'carpeta activa' : 'carpeta'}>
                <input
                  type="radio"
                  name="institucion"
                  value={institucion.id}
                  checked={institucionId === institucion.id}
                  onChange={() => setInstitucionId(institucion.id)}
                />
                <span>{institucion.nombre}</span>
                <small>{institucion.detalle}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor={claveId}>Clave de laboratorio</label>
        <input
          id={claveId}
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
          type="password"
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          required
        />
        {error ? (
          <p id={errorId} className="alerta" role="alert">
            {error}
          </p>
        ) : (
          <p className="pista">La clave de este laboratorio es demo.</p>
        )}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Abrir expediente'}
        </button>
      </form>
    </main>
  );
}

function leerSesion(): Sesion | null {
  const cruda = sessionStorage.getItem('sesion');
  if (!cruda) {
    return null;
  }
  try {
    return JSON.parse(cruda) as Sesion;
  } catch {
    return null;
  }
}

export function nombreInstitucion(id: string): string {
  return INSTITUCIONES.find((institucion) => institucion.id === id)?.nombre ?? id;
}
