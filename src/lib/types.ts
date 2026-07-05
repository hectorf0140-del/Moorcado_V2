export type UserType = "comprador" | "vendedor" | "empresa" | "veterinario";

export type PlanId = "gratuito" | "basico" | "premium";

export interface Usuario {
  id: string;
  nombre: string;
  tipo: UserType;
  avatarColor: string;
  iniciales: string;
  verificado: boolean;
  calificacion: number; // 0-5
  numeroVentas: number;
  publicacionesActivas: number;
  resenas: number;
  plan: PlanId;
  telefono: string;
  correo: string;
  departamento: string;
  registroSag?: string;
  password?: string; // para autenticación client-side
  creadoEn?: string; // ISO date
}

export type TipoGanado = "leche" | "carne" | "doble" | "reproductor";
export type Sexo = "macho" | "hembra";

export interface RegistroVeterinario {
  fecha: string;
  descripcion: string;
}

export interface Animal {
  id: string;
  nombre: string;
  raza: string;
  edadMeses: number;
  pesoKg: number;
  sexo: Sexo;
  precio: number;
  tipo: TipoGanado;
  produccionLitrosDia?: number;
  departamento: string;
  municipio: string;
  distanciaKm: number;
  lat: number;
  lng: number;
  vendedorId: string;
  destacado: boolean;
  registroSag: boolean;
  verificado: boolean;
  estadoSalud: "excelente" | "bueno" | "regular";
  vacunas: string[];
  desparasitaciones: string[];
  historialVeterinario: RegistroVeterinario[];
  padre?: string;
  madre?: string;
  registroGenealogico?: string;
  fotos: number; // cantidad de fotos simuladas
  colorPrimario: string;
  colorSecundario: string;
  publicadoHace: string;
  vistas: number;
  vendido?: boolean;
}

export interface Mensaje {
  id: string;
  autorId: string;
  texto: string;
  hora: string;
  tipo?: "texto" | "ubicacion" | "imagen";
}

export interface Conversacion {
  id: string;
  contactoId: string;
  animalId?: string;
  ultimoMensaje: string;
  hora: string;
  noLeidos: number;
  mensajes: Mensaje[];
}

export interface NotificacionItem {
  id: string;
  tipo:
    | "mensaje"
    | "animal_similar"
    | "favorito"
    | "vacuna"
    | "promocion"
    | "renovacion";
  titulo: string;
  descripcion: string;
  hora: string;
  leida: boolean;
}

export interface AnimalHato {
  id: string;
  nombre: string;
  raza: string;
  edadMeses: number;
  produccionLitrosDia?: number;
  estado: "sana" | "en_tratamiento" | "prenada" | "seca";
  proximaRevision: string;
  ultimaVacuna: string;
  valorEstimado: number;
}

export const DEPARTAMENTOS_HONDURAS = [
  "Atlántida",
  "Choluteca",
  "Colón",
  "Comayagua",
  "Copán",
  "Cortés",
  "El Paraíso",
  "Francisco Morazán",
  "Gracias a Dios",
  "Intibucá",
  "Islas de la Bahía",
  "La Paz",
  "Lempira",
  "Ocotepeque",
  "Olancho",
  "Santa Bárbara",
  "Valle",
  "Yoro",
] as const;

export const RAZAS_GANADO = [
  "Brahman",
  "Holstein",
  "Jersey",
  "Pardo Suizo",
  "Angus",
  "Brangus",
  "Indubrasil",
  "Gyr",
  "Criollo",
  "Simmental",
] as const;

// ─── Nuevos tipos para el marketplace ────────────────────────────────────────

/** Resultado de valoración de precio generado por calcularValoracion() */
export interface ValoracionResult {
  estimado: number;
  rangoMin: number;
  rangoMax: number;
  confianza: "Alta" | "Media";
}

/** Anuncio canónico del marketplace — superset de Animal */
export interface Anuncio extends Animal {
  titulo: string; // nombre del lote, ej. "Lote Lucero – 3 cabezas"
  proposito: "lechero" | "cárnico" | "doble propósito";
  descripcion: string;
  activo: boolean;
  creadoEn: string; // ISO date
  vendorId: string; // alias de vendedorId para compatibilidad
  imagenes: string[]; // URLs loremflickr
  ubicacion: {
    departamento: string;
    municipio: string;
    lat?: number;
    lng?: number;
  };
  vacunasObj: { nombre: string; fecha: string }[]; // vacunas estructuradas
}

/** Transacción de compra/venta */
export interface Transaccion {
  id: string;
  animalId: string;
  compradorId: string;
  vendedorId: string;
  precio: number; // > 0
  fecha: string; // ISO date
}

/** Testimonial para la landing page */
export interface Testimonial {
  id: string;
  cita: string;
  autor: string;
  rol: string;
  avatarColor?: string;
}

/** Estado de filtros del marketplace */
export interface FiltrosState {
  query: string;
  razas: string[];
  precioMin: number;
  precioMax: number;
  pesoMin: number;
  pesoMax: number;
  proposito: "lechero" | "cárnico" | "doble propósito" | "";
  departamento: string;
  sexo: Sexo | "";
  soloSag: boolean;
  soloVerificados: boolean;
  orden: "reciente" | "precio_asc" | "precio_desc" | "peso_asc";
}
