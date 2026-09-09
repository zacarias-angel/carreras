# Event Racing Game - Checklist de estado

Documento de seguimiento basado en `event_racing_game_recomendaciones.md` y en el estado actual del prototipo.

## Referencias

- `[x]` Implementado y disponible en el prototipo.
- `[ ]` Pendiente.
- Los puntos marcados como **Parcial** funcionan, pero todavía no cumplen toda la recomendación.

## 1. Flujo principal

- [x] Ingreso desde el celular mediante QR.
- [x] Controller web sin instalacion.
- [x] Ingreso de nombre o nickname.
- [x] Asignacion automatica de numero, color y auto.
- [x] Identificacion `P1`, `P2`, `P3` y `P4`.
- [x] Color del controller consistente con el auto y su viewport.
- [x] Boton `LISTO` para jugadores.
- [x] Privilegio de inicio para `P1`.
- [x] Bloqueo de jugadores nuevos durante una carrera.
- [x] Retorno automatico al lobby despues de resultados.
- [ ] Boton explicito `JUGAR DE NUEVO`.
- [ ] Tiempo objetivo medido desde QR hasta READY.
- [ ] Aceptacion configurable de terminos o consentimiento.

## 2. Lobby y pantalla principal

- [x] QR visible en pantalla.
- [x] Cantidad de jugadores conectados.
- [x] Cantidad de jugadores listos.
- [x] Estado de espera e inicio visible.
- [x] Nombre de los jugadores disponible para clasificacion y resultados.
- [ ] Logo y nombre comercial de la experiencia.
- [ ] URL corta alternativa al QR.
- [ ] Texto de instrucciones de alto impacto.
- [ ] Tarjetas completas de jugadores en el lobby.
- [ ] Indicar visualmente el maximo de 4 jugadores.
- [ ] Branding configurable sin editar scripts.

## 3. Inicio de carrera

- [x] Todos los autos aparecen antes de la linea.
- [x] Parrilla para hasta 4 autos.
- [x] Los autos permanecen inmoviles antes de largar.
- [x] Cuenta regresiva sincronizada de 5 segundos.
- [x] Mensaje `YA!` al iniciar.
- [ ] Animacion completa de semaforo.
- [ ] Sonido de countdown en pantalla y celulares.
- [ ] Vibracion al comenzar.
- [ ] Penalizacion por salida anticipada.
- [ ] Countdown configurable desde interfaz de operador.

## 4. Carrera

- [x] Linea de largada y meta.
- [x] Carrera de 3 vueltas.
- [x] Deteccion de vuelta con paso por la zona opuesta de la pista.
- [x] Cronometro individual.
- [x] Tiempo total.
- [x] Mejor vuelta.
- [x] Deteccion automatica de llegada.
- [x] La carrera espera que terminen todos los participantes conectados.
- [x] Posiciones calculadas con vueltas y progreso en la vuelta.
- [x] Clasificacion visible `1°, 2°, 3°...`.
- [x] Penalizacion de velocidad al circular por cesped.
- [x] Deteccion del asfalto real contra los triangulos de la malla de pista.
- [x] Velocidad y aceleracion arcade configuradas.
- [ ] Cronometro general visible durante toda la carrera.
- [ ] Invalidacion de vuelta por cortar camino.
- [ ] Duracion maxima y timeout para jugadores que no terminan.
- [ ] Deteccion avanzada de direccion incorrecta.

## 5. Autos, camaras y pantalla dividida

- [x] Modelo `car_1.fbx` utilizado por los autos.
- [x] Material `Material.car2` usado como base.
- [x] Colores rojo, azul, amarillo y verde por jugador.
- [x] Ruedas oscuras.
- [x] Camara isometrica fija, aproximada a 45 grados.
- [x] La pista no rota cuando dobla el auto.
- [x] Camara con seguimiento suavizado.
- [x] Un viewport para 1 jugador.
- [x] Dos columnas para 2 jugadores.
- [x] Grilla para 3 o 4 jugadores.
- [x] Marco del color del auto en cada viewport.
- [x] Etiqueta `P1-P4` en cada viewport.
- [ ] Evaluar camara unica compartida como alternativa para eventos.
- [ ] Camara especial o zoom de llegada.
- [ ] Replay de llegada.

## 6. Controller y feedback

- [x] Botones grandes de direccion, acelerar y frenar.
- [x] Estado visual al mantener presionado un boton.
- [x] Sonido sintetizado de motor al acelerar.
- [x] Audio desbloqueado mediante interaccion del usuario.
- [x] Flash visual fuerte al detectar choque.
- [x] Vibracion de choque cuando el navegador la soporta.
- [x] Reconectando visible al perder el WebSocket.
- [x] Scroll, zoom y seleccion accidental bloqueados durante el juego.
- [ ] Indicador de potencia o velocidad.
- [ ] Sonido de frenada.
- [ ] Sonido de derrape.
- [ ] Sonido de choque.
- [ ] Sonido de ultima vuelta.
- [ ] Sonido de victoria y derrota.
- [ ] Shake de interfaz al chocar.
- [ ] Informacion de posicion en vivo dentro del celular.
- [ ] Orientacion landscape obligatoria con aviso para girar.
- [ ] Screen Wake Lock.
- [ ] Modo fullscreen o PWA.

## 7. Colisiones y recuperacion

- [x] Deteccion simple de proximidad entre autos.
- [x] Notificacion de choque enviada a ambos celulares.
- [x] Penalizacion al salir del asfalto.
- [x] Malla de asfalto etiquetada para deteccion de superficie sin Ammo.js.
- [ ] Choque fisico entre autos.
- [ ] Empuje arcade.
- [ ] Reduccion temporal de velocidad por choque.
- [ ] Sonido de impacto.
- [ ] Colision con bordes fisicos.
- [x] Respawn automatico despues de permanecer fuera del asfalto.
- [ ] Respawn por auto volcado o trabado; actualmente no hay fisica de vuelco.
- [ ] Mensaje `Volviendo a pista...`.

## 8. Ultima vuelta y final

- [x] Conteo de vueltas individual.
- [x] Ganador detectado automaticamente.
- [x] Resultado personal en el celular.
- [x] Podio final en pantalla principal.
- [x] Tiempo total, mejor vuelta y diferencia contra el ganador.
- [ ] Aviso `FINAL LAP` en pantalla.
- [ ] Aviso y efecto de ultima vuelta en celular.
- [ ] Celebracion con confetti.
- [ ] Sonido y vibracion especial del ganador.
- [ ] Tiempo limite para cerrar la carrera despues del ganador.
- [ ] Puntaje acumulable por posicion.

## 9. Sesiones y robustez

- [x] Comunicacion en tiempo real mediante WebSocket.
- [x] Funcionamiento del controller dentro de la red local.
- [x] Reconexion automatica basica del socket.
- [x] Estados de partida `lobby`, `countdown`, `racing` y `finished`.
- [x] Estado de carrera centralizado en el servidor.
- [ ] Recuperar la misma identidad al refrescar el celular.
- [ ] Reservar el lugar durante una desconexion breve.
- [ ] Recuperar completamente una carrera al recargar la pantalla principal.
- [ ] Timeout de jugador inactivo en lobby.
- [ ] Latencia y ping medidos.
- [ ] Pruebas en matriz Android Chrome / iOS Safari.
- [ ] Diagnostico automatico de WebSocket, audio, vibracion y resolucion.
- [ ] Servidor autoritativo para posicion y vueltas.
- [ ] Tiempos calculados directamente por el reloj del servidor.

## 10. Operacion del evento

- [ ] Panel de operador.
- [ ] Iniciar, cancelar y reiniciar desde panel.
- [ ] Expulsar jugador.
- [ ] Cambiar nickname.
- [ ] Configurar vueltas, jugadores y duraciones.
- [ ] Activar o desactivar audio, vibracion y colisiones.
- [ ] Boton de emergencia `STOP RACE`.
- [ ] Health dashboard.
- [ ] Logs descargables.
- [ ] Cola de jugadores.
- [ ] Modo espectador.
- [ ] Codigo manual alternativo al QR.
- [ ] QR asociado a una sesion especifica.
- [ ] Auto-start configurable.
- [ ] Attract mode o demo mode.

## 11. Ranking, premios y datos

- [ ] Ranking persistente del evento.
- [ ] Top de tiempos del dia.
- [ ] Record de pista.
- [ ] Aviso de nuevo record.
- [ ] Persistencia en archivo o base de datos.
- [ ] Telemetria por carrera.
- [ ] Analytics del evento.
- [ ] Codigo o QR unico de premio.
- [ ] Validacion de premio por el staff.
- [ ] Reglas de elegibilidad.
- [ ] Captura configurable de email, telefono o edad.
- [ ] Filtro de nombres inapropiados.
- [ ] Social sharing.
- [ ] Exportacion de resultados.

## 12. Evoluciones opcionales

- [x] Zona duplicable de boost `x2` durante `0.5 s`.
- [x] Zona duplicable de reduccion `x0.5` durante `0.5 s`.
- [ ] Turbo manual activado desde el controller; las zonas automaticas ya existen.
- [ ] Power-ups.
- [ ] Rebufo.
- [ ] Rubber banding.
- [ ] Bots.
- [ ] Modo Time Attack.
- [ ] Modo Elimination.
- [ ] Modo Survival.
- [ ] Torneos y brackets.
- [ ] Emotes.
- [ ] Challenges del dia.
- [ ] Announcer o locutor virtual.
- [ ] Photo finish.
- [ ] Dificultad adaptativa.
- [ ] Multiple pistas.
- [ ] Skins y vehiculos alternativos.

## Proxima prioridad recomendada

- [x] **MVP completado: respawn automatico.**
- [ ] Ultima vuelta con feedback audiovisual.
- [ ] Timeout despues de la llegada del ganador.    
- [ ] Reconexion conservando nombre y jugador.
- [ ] Panel minimo de operador.
- [ ] Ranking persistente de mejores tiempos.
- [ ] Configuracion por archivo de evento.

## Alcance del MVP completado: respawn automatico

- [x] Guardar periodicamente la ultima posicion valida sobre asfalto.
- [x] Detectar cuando un auto permanece fuera de pista durante 2.5 segundos.
- [x] Reubicarlo en su ultima posicion valida.
- [x] Restaurar la ultima orientacion valida sobre el recorrido.
- [x] Llevar su velocidad a cero al reaparecer.
- [x] Aplicar un cooldown para evitar respawns repetidos.
- [x] No alterar vueltas, tiempos, nombre, color ni camara.
- [ ] Probar el comportamiento con 1, 2, 3 y 4 autos.

### Fuera del alcance inicial

- [ ] Mensaje `Volviendo a pista...` en el celular.
- [ ] Animacion o efecto visual de respawn.
- [ ] Penalizacion de tiempo.
- [ ] Deteccion de auto invertido; actualmente los autos no usan fisica de vuelco.
