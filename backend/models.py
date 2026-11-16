from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Categoria(Base):
    __tablename__ = "categorias"
    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(80), unique=True, nullable=False)
    descripcion = Column(Text)

class Marca(Base):
    __tablename__ = "marcas"
    id_marca = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(80), unique=True, nullable=False)
    pais_origen = Column(String(60))

class Producto(Base):
    __tablename__ = "productos"
    id_producto = Column(Integer, primary_key=True, index=True)
    codigo_sku = Column(String(40), unique=True, nullable=False)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(Text)
    precio = Column(Numeric(10, 2), nullable=False)
    material_montura = Column(String(60))
    color = Column(String(40))
    imagen_url = Column(Text)
    modelo_3d_url = Column(Text)
    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria"))
    id_marca = Column(Integer, ForeignKey("marcas.id_marca"))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Cliente(Base):
    __tablename__ = "clientes"
    id_cliente = Column(Integer, primary_key=True, index=True)
    tipo_documento = Column(String(20), nullable=False)
    numero_documento = Column(String(30), unique=True, nullable=False)
    nombre = Column(String(80), nullable=False)
    apellido = Column(String(80), nullable=False)
    telefono = Column(String(20))
    correo = Column(String(120), unique=True)
    direccion = Column(Text)
    fecha_registro = Column(TIMESTAMP(timezone=True), server_default=func.now())
class Venta(Base):
    __tablename__ = "ventas"
    id_venta = Column(Integer, primary_key=True, index=True)
    cliente_nombre = Column(String(120), nullable=False)
    cliente_documento = Column(String(30))
    metodo_pago = Column(String(40), default="Efectivo / QR")
    total = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(30), default="Completada")
    fecha_venta = Column(TIMESTAMP(timezone=True), server_default=func.now())

class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"
    id_detalle = Column(Integer, primary_key=True, index=True)
    id_venta = Column(Integer, ForeignKey("ventas.id_venta"))
    id_producto = Column(Integer, ForeignKey("productos.id_producto"))
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

class RecetaOptica(Base):
    __tablename__ = "recetas_opticas"
    id_receta = Column(Integer, primary_key=True, index=True)
    paciente_nombre = Column(String(120), nullable=False)
    paciente_ci = Column(String(30))
    telefono = Column(String(30))
    od_esfera = Column(String(15), default="0.00")
    od_cilindro = Column(String(15), default="0.00")
    od_eje = Column(String(15), default="0°")
    oi_esfera = Column(String(15), default="0.00")
    oi_cilindro = Column(String(15), default="0.00")
    oi_eje = Column(String(15), default="0°")
    distancia_pupilar = Column(String(15), default="62 mm")
    observaciones = Column(Text)
    fecha_registro = Column(TIMESTAMP(timezone=True), server_default=func.now())