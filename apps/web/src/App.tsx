import { FormEvent, useEffect, useState } from 'react';
import { ErrorApi, SESION_EXPIRADA, llamar, type Sesion } from './api';
import { Clinica } from './Clinica';
import { Alerta, Boton, Campo, Icono, ProveedorToast, type NombreIcono } from './ui';

export const INSTITUCIONES = [
  { id: 'hospital', nombre: 'Hospital general', detalle: 'Consultas y agenda', motor: 'PostgreSQL', icono: 'hospital' },
  { id: 'odontologia', nombre: 'Clínica odontológica', detalle: 'Odontograma', motor: 'MySQL', icono: 'diente' },
  { id: 'laboratorio', nombre: 'Laboratorio clínico', detalle: 'Resultados de examen', motor: 'MongoDB', icono: 'matraz' },
  { id: 'pediatrico', nombre: 'Centro pediátrico', detalle: 'Crecimiento y vacunas', motor: 'Redis', icono: 'jeringa' },
] as const satisfies ReadonlyArray<{ id: string; nombre: string; detalle: string; motor: string; icono: NombreIcono }>;

type InstitucionId = (typeof INSTITUCIONES)[number]['id'];

export function App() {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion());
  const [expirada, setExpirada] = useState(false);

  function entrar(siguiente: Sesion) {
    sessionStorage.setItem('sesion', JSON.stringify(siguiente));
    setExpirada(false);
    setSesion(siguiente);
  }

  function salir() {
    sessionStorage.removeItem('sesion');
    setSesion(null);
  }

  useEffect(() => {
    function alExpirar() {
      sessionStorage.removeItem('sesion');
      setExpirada(true);
      setSesion(null);
    }
    window.addEventListener(SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(SESION_EXPIRADA, alExpirar);
  }, []);

  return (
    <ProveedorToast>
      {sesion ? (
        <Clinica sesion={sesion} onSalir={salir} />
      ) : (
        <Ingreso onEntrar={entrar} expirada={expirada} institucionPrevia={leerUltimaInstitucion()} />
      )}
    </ProveedorToast>
  );
}

function Ingreso({
  onEntrar,
  expirada,
  institucionPrevia,
}: {
  onEntrar: (sesion: Sesion) => void;
  expirada: boolean;
  institucionPrevia: InstitucionId;
}) {
  const [institucionId, setInstitucionId] = useState<InstitucionId>(institucionPrevia);
  const [clave, setClave] = useState('');
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
      localStorage.setItem('ultima-institucion', institucionId);
      onEntrar(sesion);
    } catch (fallo) {
      setError(fallo instanceof ErrorApi ? fallo.message : 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="ingreso">
      <div className="ingreso__card aparece">
        <header className="ingreso__marca">
          <span className="logo">
            <Icono nombre="pulso" />
          </span>
          <h1>Historiales clínicos</h1>
          <p>Un expediente, cuatro instituciones. Tu institución decide dónde se guardan los datos.</p>
        </header>

        <form className="card" onSubmit={enviar} noValidate>
          {expirada ? <Alerta tono="warning" titulo="Tu sesión expiró">Ingresa de nuevo para continuar.</Alerta> : null}

          <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            <legend className="field__label" style={{ marginBottom: 8 }}>
              Institución
            </legend>
            <div className="instituciones">
              {INSTITUCIONES.map((institucion) => (
                <label key={institucion.id} className="institucion">
                  <input
                    type="radio"
                    name="institucion"
                    value={institucion.id}
                    checked={institucionId === institucion.id}
                    onChange={() => setInstitucionId(institucion.id)}
                  />
                  <span className="institucion__icono">
                    <Icono nombre={institucion.icono} />
                  </span>
                  <strong>{institucion.nombre}</strong>
                  <small>{institucion.motor}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <Campo etiqueta="Clave de acceso" pista="Entorno académico: la clave de demostración es «demo»." error={error || undefined}>
            {(props) => (
              <input
                {...props}
                className="input"
                value={clave}
                onChange={(evento) => setClave(evento.target.value)}
                type="password"
                autoComplete="current-password"
                autoFocus
                required
              />
            )}
          </Campo>

          <Boton type="submit" variante="primary" tamano="lg" bloque cargando={enviando} disabled={!clave}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Boton>
        </form>

        <p className="ingreso__pie">Bases de Datos II · Universidad Rafael Landívar · Datos 100 % sintéticos</p>
      </div>
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

function leerUltimaInstitucion(): InstitucionId {
  try {
    const valor = localStorage.getItem('ultima-institucion');
    return INSTITUCIONES.some((institucion) => institucion.id === valor) ? (valor as InstitucionId) : 'hospital';
  } catch {
    return 'hospital';
  }
}

export function institucion(id: string) {
  return INSTITUCIONES.find((item) => item.id === id) ?? INSTITUCIONES[0];
}
