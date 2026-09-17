import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  /** Icona mostrata nel cerchio a sinistra. */
  icon?: ReactNode
  /** Unita' di misura o testo a destra (es. "kg", "cm"). */
  suffix?: ReactNode
  /** Messaggio di errore sotto al campo. */
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

/**
 * Contenitore dei campi di input: sfondo traslucido, icona tonda a sinistra,
 * etichetta piccola sopra al valore. Avvolge un <input>, <select> o <textarea>.
 */
export function Field({ label, icon, suffix, error, hint, className = '', children }: FieldProps) {
  return (
    <div className={`${styles.wrap} ${className}`}>
      <label className={`${styles.field} ${error ? styles.hasError : ''}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.body}>
          <span className={styles.label}>{label}</span>
          {children}
        </span>
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </label>
      {error ? <p className={styles.error}>{error}</p> : hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement>

/** Campo di testo generico. */
export function TextInput(props: InputProps) {
  return <input className={styles.input} {...props} />
}

/**
 * Campo numerico "amichevole": accetta la virgola come separatore decimale
 * e apre la tastiera numerica su iPhone. Il valore resta una stringa:
 * si converte con parseNum() al salvataggio.
 */
export function NumberInput({ decimal = true, ...props }: InputProps & { decimal?: boolean }) {
  return (
    <input
      className={styles.input}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      {...props}
    />
  )
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={styles.input} {...props} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${styles.input} ${styles.textarea}`} rows={2} {...props} />
}
