from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal

class ProductoBase(BaseModel):
    codigo_sku: str
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    material_montura: Optional[str] = None
    color: Optional[str] = None
    imagen_url: Optional[str] = None
    modelo_3d_url: Optional[str] = None
    id_categoria: Optional[int] = None
    id_marca: Optional[int] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id_producto: int
    activo: bool

    class Config:
        from_attributes = True

class ClienteCreate(BaseModel):
    tipo_documento: str
    numero_documento: str
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None

class ClienteResponse(ClienteCreate):
    id_cliente: int

    class Config:
        from_attributes = True
class ItemVentaCreate(BaseModel):
    id_producto: int
    cantidad: int
    precio_unitario: Decimal
class VentaCreate(BaseModel):
    cliente_nombre: str
    cliente_documento: Optional[str] = None
    metodo_pago: str = "Efectivo / QR"
    items: List[ItemVentaCreate]

class VentaResponse(BaseModel):
    id_venta: int
    cliente_nombre: str
    cliente_documento: Optional[str] = None
    metodo_pago: str
    total: Decimal
    estado: str

    class Config:
        from_attributes = True

class RecetaCreate(BaseModel):
    paciente_nombre: str
    paciente_ci: Optional[str] = None
    telefono: Optional[str] = None
    od_esfera: str = "0.00"
    od_cilindro: str = "0.00"
    od_eje: str = "0°"
    oi_esfera: str = "0.00"
    oi_cilindro: str = "0.00"
    oi_eje: str = "0°"
    distancia_pupilar: str = "62 mm"
    observaciones: Optional[str] = None

class RecetaResponse(RecetaCreate):
    id_receta: int

    class Config:
        from_attributes = True