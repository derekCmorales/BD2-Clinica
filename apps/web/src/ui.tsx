/*
 * Primitivas del design system. Ver docs/design-system/README.md.
 * Cada primitiva es delgada a propósito: el estilo vive en styles.css (tokens + clases),
 * aquí solo va semántica, accesibilidad y comportamiento.
 */
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

/* ───────────── Íconos (trazo 1.5, 24×24, currentColor) ───────────── */
const TRAZOS = {
  buscar: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z',
  mas: 'M12 5v14M5 12h14',
  salir: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  archivo: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
  cerrar: 'M18 6 6 18M6 6l12 12',
  ojo: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ojoNo: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6',
  candado: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
  escudo: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  check: 'M20 6 9 17l-5-5',
  info: 'M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  chevron: 'm6 9 6 6 6-6',
  resumen: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  estetoscopio: 'M5 3v6a5 5 0 0 0 10 0V3M10 14v2a5 5 0 0 0 10 0v-3M20 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  calendario: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  matraz: 'M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3M7 15h10',
  grafica: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  jeringa: 'm18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6',
  diente: 'M12 5.5C10.5 4 8.5 3 6.5 3.5 4 4 3 6.5 3.5 9.5c.4 2.4 1.3 4 1.8 6.5.4 2.2.8 5 2.2 5 1.7 0 1.6-4.5 4.5-4.5s2.8 4.5 4.5 4.5c1.4 0 1.8-2.8 2.2-5 .5-2.5 1.4-4.1 1.8-6.5.5-3-.5-5.5-3-6-2-.5-4 .5-5.5 2Z',
  hospital: 'M3 21h18M5 21V7l7-4 7 4v14M10 9h4M12 7v4M9 21v-5h6v5',
  usuario: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  usuarioMas: 'M16 21a6 6 0 0 0-12 0M10 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6',
  nota: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
  pastilla: 'M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7zM8.5 8.5l7 7',
  regla: 'M21.3 15.3 8.7 2.7a1 1 0 0 0-1.4 0L2.7 7.3a1 1 0 0 0 0 1.4l12.6 12.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4ZM7.5 10.5l2-2M10.5 13.5l2-2M13.5 16.5l2-2',
  motor: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3ZM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  pulso: 'M22 12h-4l-3 9L9 3l-3 9H2',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, className }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

/* ───────────── Botón ───────────── */
type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';
type Tamano = 'sm' | 'md' | 'lg';

export function Boton({
  variante = 'secondary',
  tamano = 'md',
  icono,
  cargando = false,
  bloque = false,
  soloIcono = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  icono?: NombreIcono;
  cargando?: boolean;
  bloque?: boolean;
  soloIcono?: boolean;
}) {
  const clases = [
    'btn',
    `btn--${variante}`,
    tamano !== 'md' ? `btn--${tamano}` : '',
    bloque ? 'btn--block' : '',
    soloIcono ? 'btn--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={clases} disabled={disabled || cargando} aria-busy={cargando || undefined} {...resto}>
      {icono ? <Icono nombre={icono} /> : null}
      {children}
    </button>
  );
}

/* ───────────── Campo ───────────── */
export function Campo({
  etiqueta,
  opcional,
  pista,
  error,
  className = '',
  children,
}: {
  etiqueta: string;
  opcional?: boolean;
  pista?: string;
  error?: string;
  className?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => ReactNode;
}) {
  const id = useId();
  const pistaId = `${id}-pista`;
  const descrito = error || pista ? pistaId : undefined;
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {etiqueta} {opcional ? <span className="opcional">(opcional)</span> : null}
      </label>
      {children({ id, 'aria-describedby': descrito, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={pistaId} className="field__error">
          {error}
        </p>
      ) : pista ? (
        <p id={pistaId} className="field__hint">
          {pista}
        </p>
      ) : null}
    </div>
  );
}

/* ───────────── Insignia ───────────── */
export type Tono = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export function Insignia({
  tono = 'neutral',
  punto = false,
  icono,
  children,
}: {
  tono?: Tono;
  punto?: boolean;
  icono?: NombreIcono;
  children: ReactNode;
}) {
  return (
    <span className={`badge badge--${tono}${punto ? ' badge--dot' : ''}`}>
      {icono ? <Icono nombre={icono} /> : null}
      {children}
    </span>
  );
}

/* ───────────── Clasificación de datos (AGENTS.md §8) ───────────── */
export type Clasificacion = 'publico' | 'confidencial' | 'restringido';

const CLASIF: Record<Clasificacion, { etiqueta: string; icono: NombreIcono; titulo: string }> = {
  publico: { etiqueta: 'Público', icono: 'info', titulo: 'Dato público' },
  confidencial: { etiqueta: 'Confidencial', icono: 'candado', titulo: 'Dato confidencial: identificación del paciente' },
  restringido: { etiqueta: 'Restringido', icono: 'escudo', titulo: 'Dato restringido: cada acceso queda auditado' },
};

export function EtiquetaClasificacion({ nivel }: { nivel: Clasificacion }) {
  const datos = CLASIF[nivel];
  return (
    <span className={`clasif clasif--${nivel}`} title={datos.titulo}>
      <Icono nombre={datos.icono} />
      {datos.etiqueta}
    </span>
  );
}

/* ───────────── Alerta ───────────── */
export function Alerta({
  tono = 'info',
  titulo,
  children,
  accion,
}: {
  tono?: 'info' | 'success' | 'warning' | 'danger';
  titulo?: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  const icono: NombreIcono = tono === 'success' ? 'check' : tono === 'info' ? 'info' : 'alerta';
  return (
    <div className={`alert alert--${tono}`} role={tono === 'danger' ? 'alert' : 'status'}>
      <Icono nombre={icono} />
      <div className="alert__body">
        {titulo ? <p className="alert__title">{titulo}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
      {accion}
    </div>
  );
}

/* ───────────── Avatar ───────────── */
export function Avatar({ texto, grande = false }: { texto: string; grande?: boolean }) {
  return (
    <span className={`avatar${grande ? ' avatar--lg' : ''}`} aria-hidden="true">
      {texto}
    </span>
  );
}

/* ───────────── Estado vacío ───────────── */
export function Vacio({
  icono,
  titulo,
  children,
  accion,
}: {
  icono: NombreIcono;
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icono nombre={icono} />
      </span>
      <h3>{titulo}</h3>
      {children ? <p>{children}</p> : null}
      {accion}
    </div>
  );
}

/* ───────────── Esqueleto ───────────── */
export function Esqueleto({ ancho = '100%', alto = 12 }: { ancho?: string | number; alto?: number }) {
  return <span className="skeleton" style={{ width: ancho, height: alto }} aria-hidden="true" />;
}

/* ───────────── Diálogo (dialog nativo: foco atrapado, Esc, inert de fondo) ───────────── */
export function Dialogo({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  pequeno = false,
  children,
  pie,
  onEnviar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  pequeno?: boolean;
  children: ReactNode;
  pie: ReactNode;
  onEnviar?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descId = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) {
      return;
    }
    if (abierto && !dialogo.open) {
      dialogo.showModal();
    } else if (!abierto && dialogo.open) {
      dialogo.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className={`dialog${pequeno ? ' dialog--sm' : ''}`}
      aria-labelledby={tituloId}
      aria-describedby={descripcion ? descId : undefined}
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === ref.current) {
          onCerrar();
        }
      }}
    >
      {abierto ? (
        <form
          method="dialog"
          onSubmit={(evento) => {
            evento.preventDefault();
            onEnviar?.();
          }}
        >
          <div className="dialog__header">
            <div>
              <h2 id={tituloId} style={{ fontSize: 'var(--text-lg)' }}>
                {titulo}
              </h2>
              {descripcion ? <p id={descId}>{descripcion}</p> : null}
            </div>
            <Boton variante="ghost" soloIcono tamano="sm" icono="cerrar" aria-label="Cerrar" onClick={onCerrar} />
          </div>
          <div className="dialog__body">{children}</div>
          <div className="dialog__footer">{pie}</div>
        </form>
      ) : null}
    </dialog>
  );
}

/* ───────────── Toasts ───────────── */
interface Toast {
  id: number;
  texto: string;
}

const ContextoToast = createContext<(texto: string) => void>(() => undefined);

export function ProveedorToast({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const avisar = useCallback((texto: string) => {
    const id = Date.now() + Math.random();
    setToasts((actuales) => [...actuales.slice(-2), { id, texto }]);
    window.setTimeout(() => setToasts((actuales) => actuales.filter((toast) => toast.id !== id)), 3500);
  }, []);
  return (
    <ContextoToast.Provider value={avisar}>
      {children}
      <div className="toaster" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <Icono nombre="check" />
            {toast.texto}
          </div>
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

export function useToast() {
  return useContext(ContextoToast);
}

/* ───────────── Dato protegido (confidencial, oculto por defecto) ───────────── */
export function DatoProtegido({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  const [visible, setVisible] = useState(false);
  const enmascarado = valor.length > 4 ? `${'•'.repeat(Math.min(valor.length - 4, 9))}${valor.slice(-4)}` : '••••';
  return (
    <span className="dato-protegido">
      <span className="mono" aria-label={visible ? `${etiqueta} ${valor}` : `${etiqueta} oculto`}>
        {visible ? valor : enmascarado}
      </span>
      <button
        type="button"
        onClick={() => setVisible((actual) => !actual)}
        aria-pressed={visible}
        aria-label={visible ? `Ocultar ${etiqueta}` : `Mostrar ${etiqueta}`}
        title={visible ? `Ocultar ${etiqueta}` : `Mostrar ${etiqueta}`}
      >
        <Icono nombre={visible ? 'ojoNo' : 'ojo'} />
      </button>
    </span>
  );
}
