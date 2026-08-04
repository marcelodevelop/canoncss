// Repeat checkpoint for the canon-stock drift test.
//
// Generated at the end of the build session from the same one-paragraph
// requirement used at the start, without reopening the original file:
//
//   "A product list: search by name or SKU, sortable by name and by stock, a
//    row per product showing SKU, name, category, stock, minimum and price,
//    and a control to open the edit form. Empty state when there are no
//    products, with an action to create the first one."
//
// Compared structurally against src/screens/Productos.tsx in the canon-stock
// repo. See docs/drift-report-2026-08.md.

import { useState } from 'react';
import { useProductos } from '../App';

export function ProductosCheckpoint({ onEditar }: { onEditar: (id: string | null) => void }) {
  const productos = useProductos();
  const [filtro, setFiltro] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'stock'>('nombre');

  const q = filtro.trim().toLowerCase();
  const visibles = productos
    .filter((p) => !q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .sort((a, b) =>
      ordenarPor === 'nombre' ? a.nombre.localeCompare(b.nombre) : a.stock - b.stock,
    );

  if (productos.length === 0) {
    return (
      <article data-component="card">
        <div data-slot="header">No hay productos cargados</div>
        <div data-slot="body">
          <p data-tone="subtle">Empeza cargando el primero.</p>
        </div>
        <div data-slot="footer">
          <button data-component="button" data-variant="primary" onClick={() => onEditar(null)}>
            Cargar producto
          </button>
        </div>
      </article>
    );
  }

  return (
    <div data-layout="stack" data-gap="lg">
      <div data-layout="row" data-gap="md" data-justify="between" data-align="center" data-wrap>
        <h1>Productos</h1>
        <div data-layout="row" data-gap="sm">
          <input
            data-component="input"
            type="search"
            aria-label="Buscar"
            placeholder="Buscar por nombre o SKU"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <select
            data-component="select"
            aria-label="Ordenar"
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as 'nombre' | 'stock')}
          >
            <option value="nombre">Nombre</option>
            <option value="stock">Stock</option>
          </select>
        </div>
      </div>

      <table data-component="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoria</th>
            <th>Stock</th>
            <th>Minimo</th>
            <th>Precio</th>
            <th>
              <span className="sr-only">Editar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((p) => (
            <tr key={p.id}>
              <td data-mono>{p.sku}</td>
              <td>{p.nombre}</td>
              <td>{p.categoria}</td>
              <td>
                {p.stock <= p.minimo ? (
                  <span data-component="badge" data-variant="warning">
                    {p.stock}
                  </span>
                ) : (
                  p.stock
                )}
              </td>
              <td>{p.minimo}</td>
              <td data-mono>{(p.precioCentavos / 100).toFixed(2)}</td>
              <td>
                <button
                  data-component="button"
                  data-variant="ghost"
                  data-size="sm"
                  onClick={() => onEditar(p.id)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
