import React, { useEffect, useState } from 'react';
import VisorLentes3D from './VisorLentes3D';

const API_URL = 'http://127.0.0.1:8000';

const PALETA_COLORES = [
  { nombre: 'Negro Mate', hex: '#1e293b' },
  { nombre: 'Dorado', hex: '#d4af37' },
  { nombre: 'Plateado', hex: '#cbd5e1' },
  { nombre: 'Azul Cobalto', hex: '#1d4ed8' },
  { nombre: 'Carey / Ámbar', hex: '#92400e' },
  { nombre: 'Vino', hex: '#881337' },
];

const TIPOS_CRISTAL = [
  { id: 'transparente', nombre: 'Transparente Antirreflejo', extra: 0 },
  { id: 'luz_azul', nombre: 'Filtro Luz Azul (PC)', extra: 80 },
  { id: 'polarizado', nombre: 'Polarizado Solar', extra: 120 },
  { id: 'ambar', nombre: 'Fotocromático Ámbar', extra: 150 },
];

const FORMAS_ARO = [
  { id: 'redondo', nombre: 'Redondo Clásico' },
  { id: 'aviador', nombre: 'Aviador' },
  { id: 'rectangular', nombre: 'Rectangular' },
];

export default function App() {
  const [pestana, setPestana] = useState('tienda'); // 'tienda' | 'recetas'
  const [productos, setProductos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Personalizador 3D
  const [colorMontura, setColorMontura] = useState('#1e293b');
  const [nombreColor, setNombreColor] = useState('Negro Mate');
  const [tipoCristal, setTipoCristal] = useState('transparente');
  const [formaAro, setFormaAro] = useState('redondo');

  // Carrito y Ventas
  const [carrito, setCarrito] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDoc, setClienteDoc] = useState('');
  const [metodoPago, setMetodoPago] = useState('QR Simple');
  const [ventas, setVentas] = useState([]);
  const [guardandoVenta, setGuardandoVenta] = useState(false);

  // Recetas Ópticas
  const [recetas, setRecetas] = useState([]);
  const [guardandoReceta, setGuardandoReceta] = useState(false);
  const [formReceta, setFormReceta] = useState({
    paciente_nombre: '',
    paciente_ci: '',
    telefono: '',
    od_esfera: '-1.25',
    od_cilindro: '-0.50',
    od_eje: '90°',
    oi_esfera: '-1.00',
    oi_cilindro: '-0.25',
    oi_eje: '85°',
    distancia_pupilar: '62 mm',
    observaciones: '',
  });

  const cargarDatos = async () => {
    try {
      const [resProd, resVentas, resRecetas] = await Promise.all([
        fetch(`${API_URL}/productos`),
        fetch(`${API_URL}/ventas`),
        fetch(`${API_URL}/recetas`),
      ]);
      const dataProd = await resProd.json();
      setProductos(dataProd);
      if (dataProd.length > 0 && !seleccionado) {
        seleccionarModelo(dataProd[0]);
      }
      if (resVentas.ok) setVentas(await resVentas.json());
      if (resRecetas.ok) setRecetas(await resRecetas.json());
    } catch (err) {
      console.error('Error conectando con FastAPI:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const seleccionarModelo = (prod) => {
    setSeleccionado(prod);
    const c = (prod.color || '').toLowerCase();
    if (c.includes('dorado')) {
      setColorMontura('#d4af37');
      setNombreColor('Dorado');
      setFormaAro('aviador');
    } else if (c.includes('plateado')) {
      setColorMontura('#cbd5e1');
      setNombreColor('Plateado');
      setFormaAro('rectangular');
    } else {
      setColorMontura('#1e293b');
      setNombreColor('Negro Mate');
      setFormaAro('redondo');
    }
  };

  const cristalInfo = TIPOS_CRISTAL.find((t) => t.id === tipoCristal) || TIPOS_CRISTAL[0];
  const precioFinalPersonalizado = seleccionado
    ? Number(seleccionado.precio) + cristalInfo.extra
    : 0;

  const agregarAlCarrito = (prod, personalizado = false) => {
    const precioItem = personalizado ? precioFinalPersonalizado : Number(prod.precio);
    const etiqueta = personalizado
      ? `${prod.nombre} (${nombreColor} • ${cristalInfo.nombre})`
      : prod.nombre;

    setCarrito((prev) => {
      const existe = prev.find((i) => i.key === etiqueta);
      if (existe) {
        return prev.map((i) =>
          i.key === etiqueta ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          key: etiqueta,
          id_producto: prod.id_producto,
          nombre: etiqueta,
          precio: precioItem,
          cantidad: 1,
        },
      ];
    });
  };

  const quitarDelCarrito = (key) => {
    setCarrito((prev) => prev.filter((i) => i.key !== key));
  };

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const confirmarVenta = async (e) => {
    e.preventDefault();
    if (!clienteNombre.trim() || carrito.length === 0) return;

    setGuardandoVenta(true);
    try {
      const payload = {
        cliente_nombre: clienteNombre.trim(),
        cliente_documento: clienteDoc.trim() || null,
        metodo_pago: metodoPago,
        items: carrito.map((i) => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
        })),
      };

      const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al registrar la venta');

      setCarrito([]);
      setClienteNombre('');
      setClienteDoc('');
      await cargarDatos();
    } catch (err) {
      alert('Error al guardar la venta: ' + err.message);
    } finally {
      setGuardandoVenta(false);
    }
  };

  const guardarReceta = async (e) => {
    e.preventDefault();
    if (!formReceta.paciente_nombre.trim()) return;

    setGuardandoReceta(true);
    try {
      const res = await fetch(`${API_URL}/recetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formReceta),
      });
      if (!res.ok) throw new Error('No se pudo guardar la receta');

      setFormReceta({
        paciente_nombre: '',
        paciente_ci: '',
        telefono: '',
        od_esfera: '0.00',
        od_cilindro: '0.00',
        od_eje: '0°',
        oi_esfera: '0.00',
        oi_cilindro: '0.00',
        oi_eje: '0°',
        distancia_pupilar: '62 mm',
        observaciones: '',
      });
      await cargarDatos();
    } catch (err) {
      alert('Error al guardar receta: ' + err.message);
    } finally {
      setGuardandoReceta(false);
    }
  };

  const asignarPacienteAVenta = (receta) => {
    setClienteNombre(receta.paciente_nombre);
    setClienteDoc(receta.paciente_ci || '');
    setPestana('tienda');
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Cabecera + Navegación */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>👓 Óptica Visión 3D</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>
              Personalizador 3D, Recetas Oftalmológicas y Punto de Venta • FastAPI + Supabase
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setPestana('tienda')}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                background: pestana === 'tienda' ? '#2563eb' : '#e2e8f0',
                color: pestana === 'tienda' ? '#fff' : '#334155',
              }}
            >
              🕶️ Catálogo 3D & Ventas
            </button>
            <button
              type="button"
              onClick={() => setPestana('recetas')}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                background: pestana === 'recetas' ? '#2563eb' : '#e2e8f0',
                color: pestana === 'recetas' ? '#fff' : '#334155',
              }}
            >
              📋 Pacientes y Recetas ({recetas.length})
            </button>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '999px', fontWeight: '600', fontSize: '13px' }}>
              ● API Conectada
            </span>
          </div>
        </header>

        {cargando ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Cargando datos desde Supabase...</p>
        ) : pestana === 'recetas' ? (
          /* PESTAÑA 2: PACIENTES Y RECETAS ÓPTICAS */
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#0f172a' }}>🩺 Nueva Receta Oftalmológica</h2>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                Registra la medida visual del paciente directamente en Supabase.
              </p>

              <form onSubmit={guardarReceta} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  required
                  placeholder="Nombre completo del paciente *"
                  value={formReceta.paciente_nombre}
                  onChange={(e) => setFormReceta({ ...formReceta, paciente_nombre: e.target.value })}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="CI / Documento"
                    value={formReceta.paciente_ci}
                    onChange={(e) => setFormReceta({ ...formReceta, paciente_ci: e.target.value })}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <input
                    type="text"
                    placeholder="Teléfono / WhatsApp"
                    value={formReceta.telefono}
                    onChange={(e) => setFormReceta({ ...formReceta, telefono: e.target.value })}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                {/* Tabla de Graduación OD y OI */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', textAlign: 'center' }}>
                    <span>Ojo</span>
                    <span>Esfera (SPH)</span>
                    <span>Cilindro (CYL)</span>
                    <span>Eje (AXIS)</span>
                  </div>

                  {/* Ojo Derecho (OD) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#1d4ed8' }}>OD (Der)</span>
                    <input
                      type="text"
                      value={formReceta.od_esfera}
                      onChange={(e) => setFormReceta({ ...formReceta, od_esfera: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={formReceta.od_cilindro}
                      onChange={(e) => setFormReceta({ ...formReceta, od_cilindro: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={formReceta.od_eje}
                      onChange={(e) => setFormReceta({ ...formReceta, od_eje: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                    />
                  </div>

                  {/* Ojo Izquierdo (OI) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#1d4ed8' }}>OI (Izq)</span>
                    <input
                      type="text"
                      value={formReceta.oi_esfera}
                      onChange={(e) => setFormReceta({ ...formReceta, oi_esfera: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={formReceta.oi_cilindro}
                      onChange={(e) => setFormReceta({ ...formReceta, oi_cilindro: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                    />
                    <input
                      type="text"
                      value={formReceta.oi_eje}
                      onChange={(e) => setFormReceta({ ...formReceta, oi_eje: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Dist. Pupilar (DP)</label>
                    <input
                      type="text"
                      value={formReceta.distancia_pupilar}
                      onChange={(e) => setFormReceta({ ...formReceta, distancia_pupilar: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Diagnóstico / Notas</label>
                    <input
                      type="text"
                      placeholder="Ej: Miopía leve + Astigmatismo, uso PC"
                      value={formReceta.observaciones}
                      onChange={(e) => setFormReceta({ ...formReceta, observaciones: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardandoReceta}
                  style={{
                    padding: '11px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {guardandoReceta ? 'Guardando Receta...' : '💾 Guardar Receta en Supabase'}
                </button>
              </form>
            </div>

            {/* Listado de Historial de Recetas */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 14px', color: '#0f172a' }}>📑 Historial Clínico de Recetas ({recetas.length})</h3>
              {recetas.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Aún no hay recetas ópticas registradas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recetas.map((r) => (
                    <div key={r.id_receta} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '15px', color: '#0f172a' }}>#{r.id_receta} • {r.paciente_nombre}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            CI: {r.paciente_ci || 'S/N'} • Tel: {r.telefono || 'S/N'} • DP: {r.distancia_pupilar}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => asignarPacienteAVenta(r)}
                          style={{
                            padding: '6px 12px',
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Usar en Venta →
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', background: '#fff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <strong>OD:</strong> SPH {r.od_esfera} | CYL {r.od_cilindro} | EJE {r.od_eje}
                        </div>
                        <div>
                          <strong>OI:</strong> SPH {r.oi_esfera} | CYL {r.oi_cilindro} | EJE {r.oi_eje}
                        </div>
                      </div>
                      {r.observaciones && (
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                          📝 {r.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PESTAÑA 1: CATÁLOGO 3D Y PUNTO DE VENTA */
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
            <div>
              {seleccionado && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <VisorLentes3D
                      colorMontura={colorMontura}
                      tipoCristal={tipoCristal}
                      formaAro={formaAro}
                    />

                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                        SKU: {seleccionado.codigo_sku}
                      </span>
                      <h2 style={{ margin: '4px 0 6px', fontSize: '24px', color: '#0f172a' }}>
                        {seleccionado.nombre}
                      </h2>
                      <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '14px' }}>
                        {seleccionado.descripcion}
                      </p>

                      {/* Color de Montura */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                          Color de Montura: <span style={{ color: '#2563eb' }}>{nombreColor}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {PALETA_COLORES.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              title={c.nombre}
                              onClick={() => {
                                setColorMontura(c.hex);
                                setNombreColor(c.nombre);
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: c.hex,
                                border: colorMontura === c.hex ? '3px solid #2563eb' : '2px solid #cbd5e1',
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Forma del Aro */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                          Estilo de Aro 3D:
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {FORMAS_ARO.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setFormaAro(f.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: formaAro === f.id ? '1px solid #2563eb' : '1px solid #cbd5e1',
                                background: formaAro === f.id ? '#eff6ff' : '#fff',
                                color: formaAro === f.id ? '#1d4ed8' : '#475569',
                                cursor: 'pointer',
                              }}
                            >
                              {f.nombre}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tratamiento de Cristal */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                          Tratamiento del Cristal:
                        </div>
                        <select
                          value={tipoCristal}
                          onChange={(e) => setTipoCristal(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                          }}
                        >
                          {TIPOS_CRISTAL.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombre} {t.extra > 0 ? `(+Bs. ${t.extra})` : '(Incluido)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Precio configurado:</span>
                        <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                          Bs. {precioFinalPersonalizado.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => agregarAlCarrito(seleccionado, true)}
                        style={{
                          width: '100%',
                          padding: '11px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        + Agregar Lente Personalizado al Carrito
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <h3 style={{ margin: '0 0 14px', color: '#0f172a' }}>Modelos Disponibles ({productos.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
                {productos.map((prod) => (
                  <div
                    key={prod.id_producto}
                    style={{
                      background: '#fff',
                      borderRadius: '14px',
                      padding: '16px',
                      border: seleccionado?.id_producto === prod.id_producto ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                      <span>{prod.codigo_sku}</span>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px' }}>
                        {prod.material}
                      </span>
                    </div>
                    <h4 style={{ margin: '8px 0 4px', color: '#0f172a' }}>{prod.nombre}</h4>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748b' }}>Color base: {prod.color}</p>
                    <div style={{ fontWeight: '800', fontSize: '17px', marginBottom: '12px', color: '#0f172a' }}>
                      Bs. {Number(prod.precio).toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => seleccionarModelo(prod)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Personalizar 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarAlCarrito(prod, false)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        + Carrito
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrito y Últimas Ventas */}
            <aside style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 12px', textAlign: 'center', color: '#0f172a' }}>
                🛒 Carrito de Pedido ({carrito.reduce((s, i) => s + i.cantidad, 0)})
              </h3>

              {carrito.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', margin: '16px 0' }}>
                  Personaliza un lente en el visor 3D o selecciona una montura del catálogo.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    {carrito.map((item) => (
                      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{item.nombre}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {item.cantidad} x Bs. {item.precio.toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarDelCarrito(item.key)}
                          style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px', marginBottom: '14px', color: '#0f172a' }}>
                    <span>Total:</span>
                    <span>Bs. {totalCarrito.toFixed(2)}</span>
                  </div>

                  <form onSubmit={confirmarVenta} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo del cliente *"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                    <input
                      type="text"
                      placeholder="CI / NIT (Opcional)"
                      value={clienteDoc}
                      onChange={(e) => setClienteDoc(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    >
                      <option value="QR Simple">Pago con QR Simple</option>
                      <option value="Efectivo en tienda">Efectivo en tienda</option>
                      <option value="Tarjeta Débito / Crédito">Tarjeta Débito / Crédito</option>
                    </select>
                    <button
                      type="submit"
                      disabled={guardandoVenta}
                      style={{
                        padding: '11px',
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {guardandoVenta ? 'Guardando...' : 'Confirmar Venta en Supabase'}
                    </button>
                  </form>
                </>
              )}

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

              <h4 style={{ margin: '0 0 10px', textAlign: 'center', color: '#0f172a' }}>
                🧾 Últimas Ventas ({ventas.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ventas.map((v) => (
                  <div key={v.id_venta} style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                      <span>#{v.id_venta} - {v.cliente_nombre}</span>
                      <span style={{ color: '#16a34a' }}>Bs. {Number(v.total).toFixed(2)}</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                      {v.metodo_pago} • {v.estado}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}