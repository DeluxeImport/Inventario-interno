import { useState } from 'react';

const NUEVA = '__nueva__';

// Select con las opciones conocidas + una opción "Otra…" que revela un input
// para escribir un valor nuevo. Reemplaza al <input list> (datalist) nativo,
// que en algunos navegadores se ve feo y no se puede estilizar.
export default function Combobox({
  value,
  onChange,
  options,
  groups, // alternativa a options: [{ label, options: [...] }] para mostrar optgroups
  placeholder = 'Selecciona…',
  nuevaLabel = '➕ Otra…',
  nuevaPlaceholder = 'Escribe un valor nuevo',
  required = false,
}) {
  const flat = groups ? groups.flatMap((g) => g.options) : options;
  const conocido = flat.includes(value);
  const [manual, setManual] = useState(!!value && !conocido);

  if (manual) {
    return (
      <div className="combo-nueva">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={nuevaPlaceholder}
          required={required}
          autoFocus
        />
        <button
          type="button"
          className="btn btn-sm"
          title="Elegir de la lista"
          onClick={() => {
            setManual(false);
            onChange('');
          }}
        >
          ↩ Lista
        </button>
      </div>
    );
  }

  return (
    <select
      value={conocido ? value : ''}
      onChange={(e) => {
        if (e.target.value === NUEVA) {
          setManual(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
      required={required}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {groups
        ? groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </optgroup>
          ))
        : options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
      <option value={NUEVA}>{nuevaLabel}</option>
    </select>
  );
}
