/**
 * Datos de prueba centralizados para AutoLog.
 * Modificar aquí antes de correr los tests.
 */

const BASE_URL = 'http://localhost:4200';
const API_URL  = 'http://127.0.0.1:8000';

// Usuario tipo CLIENTE de prueba (creado via Django shell)
const CLIENTE = {
  username : 'cliente_playwright',
  password : 'AutoLog2025!',
  nombre   : 'Carlos',
  apellido : 'Playwright',
  dni      : '40999001',
  telefono : '+543513000001',
  email    : 'cliente_playwright@test.com',
};

// Usuario tipo TÉCNICO/TALLER de prueba (creado via Django shell)
const TECNICO = {
  username       : 'tecnico_playwright',
  password       : 'AutoLog2025!',
  nombre         : 'Laura',
  apellido       : 'Playwright',
  dni            : '40999002',
  telefono       : '+543513000002',
  email          : 'tecnico_playwright@test.com',
  nombreTaller   : 'Taller Playwright',
  cuitTaller     : '20409990021',
  direccionTaller: 'Av. Testing 123',
};

// Vehículo de prueba (para crear en tests de taller)
const VEHICULO = {
  patente  : 'PW001AA',
  marca    : 'Toyota',
  modelo   : 'Corolla',
  anio     : '2020',
  kilometraje: '50000',
};

module.exports = { BASE_URL, API_URL, CLIENTE, TECNICO, VEHICULO };
