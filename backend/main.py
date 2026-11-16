from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

app = FastAPI(
    title="API Sistema Web Óptica Visión",
    description="Backend con FastAPI, SQLAlchemy y PostgreSQL (Supabase)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def inicio():
    return {"mensaje": "API de Óptica Visión funcionando correctamente"}

@app.get("/productos", response_model=List[schemas.ProductoResponse], tags=["Productos"])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).filter(models.Producto.activo == True).all()

@app.post("/productos", response_model=schemas.ProductoResponse, tags=["Productos"])
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    nuevo_producto = models.Producto(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@app.get("/clientes", response_model=List[schemas.ClienteResponse], tags=["Clientes"])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(models.Cliente).all()

@app.post("/clientes", response_model=schemas.ClienteResponse, tags=["Clientes"])
def registrar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    nuevo_cliente = models.Cliente(**cliente.model_dump())
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

@app.post("/ventas", response_model=schemas.VentaResponse, tags=["Ventas"])
def registrar_venta(venta: schemas.VentaCreate, db: Session = Depends(get_db)):
    if not venta.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    total_calculado = sum(item.precio_unitario * item.cantidad for item in venta.items)

    nueva_venta = models.Venta(
        cliente_nombre=venta.cliente_nombre,
        cliente_documento=venta.cliente_documento,
        metodo_pago=venta.metodo_pago,
        total=total_calculado,
    )
    db.add(nueva_venta)
    db.commit()
    db.refresh(nueva_venta)

    for item in venta.items:
        detalle = models.DetalleVenta(
            id_venta=nueva_venta.id_venta,
            id_producto=item.id_producto,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario,
            subtotal=item.precio_unitario * item.cantidad,
        )
        db.add(detalle)

    db.commit()
    return nueva_venta

@app.get("/ventas", response_model=List[schemas.VentaResponse], tags=["Ventas"])
def listar_ventas(db: Session = Depends(get_db)):
    return db.query(models.Venta).order_by(models.Venta.id_venta.desc()).all()

@app.get("/recetas", response_model=List[schemas.RecetaResponse], tags=["Recetas"])
def listar_recetas(db: Session = Depends(get_db)):
    return db.query(models.RecetaOptica).order_by(models.RecetaOptica.id_receta.desc()).all()

@app.post("/recetas", response_model=schemas.RecetaResponse, tags=["Recetas"])
def registrar_receta(receta: schemas.RecetaCreate, db: Session = Depends(get_db)):
    nueva_receta = models.RecetaOptica(**receta.model_dump())
    db.add(nueva_receta)
    db.commit()
    db.refresh(nueva_receta)
    return nueva_receta