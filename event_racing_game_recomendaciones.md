# Event Racing Game — Recomendaciones de Producto y Funcionalidades

## 1. Objetivo del sistema

Convertir el prototipo actual en una experiencia competitiva para eventos, fácil de entender y rápida de jugar, en la que los participantes:

1. escanean un QR;
2. ingresan desde su celular sin instalar una app;
3. se identifican con un nombre;
4. reciben automáticamente un auto/color;
5. compiten en una carrera corta;
6. reciben feedback desde el celular durante la partida;
7. ven claramente quién ganó;
8. pueden volver a jugar o participar por un premio.

El objetivo principal debería ser minimizar al máximo la fricción. Desde que una persona escanea el QR hasta que está lista para competir deberían pasar idealmente menos de 20–30 segundos.

---

# 2. Flujo ideal de una partida

## Etapa A — Lobby / ingreso

### Pantalla principal

Mientras no hay una carrera activa, la pantalla general debería mostrar:

- nombre/logo de la experiencia;
- QR grande para ingresar;
- URL corta alternativa al QR;
- mensaje tipo `Escaneá el QR para correr`;
- cantidad de jugadores conectados;
- cantidad máxima de jugadores permitidos;
- lista o tarjetas de los jugadores que ya ingresaron;
- indicación visual de que la próxima carrera está por comenzar.

Ejemplo:

`4 / 8 jugadores listos`

### Flujo en celular

Al escanear el QR:

1. abrir directamente el controller web;
2. pedir un nombre o nickname;
3. opcionalmente pedir aceptación de términos / consentimiento si se capturan datos;
4. asignar automáticamente un color y/o auto;
5. mostrar al usuario algo como:

`Sos el auto ROJO`

6. mostrar botón `LISTO`.

### Identificación visual

Cada jugador debería tener:

- nombre;
- color propio;
- número o avatar;
- auto asociado.

El color del celular debería coincidir claramente con el auto de la pantalla.

---

# 3. Inicio de carrera

Cuando todos estén listos o el operador dispare la carrera:

### Countdown

Mostrar:

`3`

`2`

`1`

`GO!`

Agregar:

- animación;
- sonido;
- vibración/haptic feedback cuando sea posible;
- cambio visual del controller.

Durante el countdown los autos no deberían poder moverse.

Una salida anticipada podría opcionalmente generar una penalización.

---

# 4. Mecánica de carrera

El prototipo actual necesita transformarse de una simulación libre a una carrera con reglas claras.

## Elementos mínimos

Agregar:

- línea de largada/meta;
- cantidad determinada de vueltas;
- detección correcta de vueltas;
- posición actual de cada jugador;
- cronómetro general;
- tiempo individual;
- detección de finalización;
- ganador automático.

Ejemplo recomendado para eventos:

- 3 vueltas;
- partidas de aproximadamente 30–90 segundos.

Las partidas cortas permiten mayor rotación de público.

---

# 5. Posición de los jugadores

Durante la carrera debería calcularse constantemente:

- 1°;
- 2°;
- 3°;
- etc.

No solamente por distancia física a la meta sino considerando:

`vueltas completadas + progreso dentro de la vuelta actual`.

En pantalla podría mostrarse discretamente:

`1. Agus`

`2. Angel`

`3. Lino`

Para no tapar la carrera también puede aparecer solamente en momentos específicos.

---

# 6. Feedback en el celular

El teléfono debería sentirse como un verdadero control del vehículo y no simplemente como botones HTML.

## Feedback visual

Cuando acelera:

- animación del botón;
- cambio visual;
- pequeño movimiento o glow;
- indicador de potencia.

Cuando frena:

- animación diferente;
- feedback inmediato.

Cuando choca:

- flash visual;
- pequeño shake de la interfaz;
- mensaje corto opcional.

Ejemplo:

`💥 BOOM`

---

# 7. Audio desde el celular

Muy recomendable.

El celular puede reproducir feedback local como:

- motor acelerando;
- frenada;
- derrape;
- choque;
- countdown;
- última vuelta;
- victoria;
- derrota.

### Consideración técnica

Los navegadores móviles suelen bloquear audio automático hasta que el usuario haya realizado una interacción.

Por eso conviene inicializar/desbloquear el audio cuando el usuario presiona por primera vez `LISTO`, `JUGAR` o el acelerador.

Una vez habilitado el contexto de audio, el juego puede reproducir efectos posteriores.

### Recomendación

No transmitir continuamente audio desde el servidor.

Los sonidos deberían estar precargados en el cliente y activarse mediante eventos del juego para reducir latencia.

---

# 8. Haptic feedback / vibración

Sí puede implementarse en ciertos dispositivos utilizando APIs web como `navigator.vibrate()`.

Ejemplos:

- toque muy corto al acelerar;
- vibración fuerte al chocar;
- vibración al comenzar;
- patrón especial al ganar.

Ejemplo conceptual:

```js
navigator.vibrate(80)
```

Para un choque:

```js
navigator.vibrate([80, 40, 120])
```

### Importante

No debe considerarse una funcionalidad garantizada.

El soporte varía mucho según navegador y sistema operativo y, particularmente, puede ser inexistente o restringido en iPhone/Safari.

Debe implementarse como **progressive enhancement**:

`si el dispositivo lo soporta → usarlo`

`si no → continuar normalmente`.

---

# 9. Colisiones

Agregar colisiones cambia mucho la sensación de juego.

## Colisión con bordes

Cuando un jugador sale o golpea el límite:

- reducir velocidad;
- reproducir sonido;
- mostrar impacto;
- vibrar si es posible.

## Colisión entre autos

Opcionalmente:

- choque físico;
- reducción temporal de velocidad;
- empuje;
- pérdida momentánea de control.

### Recomendación para eventos

Mantener la física divertida y arcade, no realista.

El castigo no debería dejar al jugador detenido durante mucho tiempo.

---

# 10. Respawn / recuperación

Un jugador nunca debería poder quedar atrapado.

Si un auto:

- sale completamente de pista;
- queda invertido;
- queda trabado;
- permanece inmóvil en una zona inválida;

el sistema debería reposicionarlo automáticamente en pista después de 1–3 segundos.

Mostrar en celular:

`Volviendo a pista…`

---

# 11. Última vuelta

Cuando empieza la última vuelta debería generarse un momento de tensión.

En pantalla:

`FINAL LAP`

En celular:

- sonido especial;
- animación;
- vibración si está disponible.

---

# 12. Final de carrera

Cuando el primer jugador termina:

- marcarlo inmediatamente como ganador;
- opcionalmente permitir que los demás terminen durante algunos segundos;
- detener la carrera luego de un timeout.

Ejemplo:

`🏆 AGUS WINS!`

Luego mostrar un podio.

---

# 13. Scoreboard / podio

Pantalla final sugerida:

## Resultado

🥇 Agus — 00:42.38  
🥈 Angel — 00:44.02  
🥉 Lino — 00:47.91

También mostrar:

- mejor vuelta;
- tiempo total;
- diferencia contra el ganador.

Ejemplo:

`+1.64 s`

---

# 14. Resultado en cada celular

Cada jugador debería recibir una pantalla personal.

Ganador:

`🏆 GANASTE`

`Tiempo: 42.38 s`

`Mejor vuelta: 13.02 s`

Segundo:

`🥈 Terminaste 2°`

`Te faltaron 1.64 s`

Esto hace que el resultado se sienta personal incluso cuando la pantalla principal está lejos.

---

# 15. Premios

Si la experiencia entrega premios, debería existir una mecánica clara de validación.

Posibilidades:

### Código único de ganador

Después de ganar:

`Tu código: WIN-8246`

El staff puede validarlo desde una pantalla administrativa.

### QR de premio

Mostrar un QR único en el celular del ganador.

El promotor lo escanea para marcarlo como entregado.

### Integración con impresora

Opcionalmente generar:

- ticket;
- voucher;
- cupón;
- foto del ganador.

### Regla de elegibilidad

Poder configurar reglas como:

- un premio por persona;
- un premio por email/teléfono;
- un premio cada N partidas;
- ganador absoluto del día;
- mejor tiempo del día.

---

# 16. Ranking del evento

Además del resultado de cada carrera puede existir un ranking persistente.

Ejemplo:

## TOP TIMES TODAY

1. Nico — 38.21 s
2. Mica — 39.02 s
3. Fran — 39.11 s
4. Agus — 40.04 s

Esto genera un segundo nivel de competencia.

Una persona puede ganar su carrera pero igualmente intentar mejorar el récord general.

---

# 17. Récord de pista

Durante el juego puede mostrarse:

`RECORD: 38.21 — Nico`

Si alguien lo rompe:

`🔥 NEW RECORD!`

con una animación grande.

Esta mecánica es especialmente efectiva para activaciones durante varias horas o días.

---

# 18. Revancha / replay

Después del resultado, ofrecer:

`JUGAR DE NUEVO`

El sistema puede decidir:

- mantener a los mismos jugadores;
- devolverlos a una cola;
- exigir volver a escanear dependiendo de la dinámica del evento.

Preferentemente no obligar a escanear nuevamente.

---

# 19. Cola de jugadores

Cuando el juego está lleno, nuevos usuarios deberían poder ingresar a una cola.

Ejemplo en celular:

`Hay una carrera en curso.`

`Estás #3 en la fila.`

Luego:

`¡Preparáte! Sos el próximo.`

Esto evita personas escaneando repetidamente o preguntando al staff qué hacer.

---

# 20. Spectator mode

Una persona que escanea durante una carrera puede opcionalmente ver:

- posiciones;
- vuelta actual;
- ganador probable;
- ranking del evento.

Luego puede entrar automáticamente a la próxima carrera.

---

# 21. Power-ups — opcional

Una evolución divertida podría incluir power-ups arcade.

Ejemplos:

- turbo;
- aceite;
- escudo;
- slowdown a otro jugador;
- boost temporal;
- invencibilidad.

Podrían activarse al pasar por sectores de la pista.

En celular aparecería un botón:

`⚡ TURBO`

### Recomendación

No incluir inicialmente.

Primero estabilizar una carrera competitiva simple.

---

# 22. Turbo / boost

Una mecánica simple y efectiva sin agregar demasiada complejidad:

Cada jugador tiene una barra de turbo.

Ejemplo:

`BOOST 100%`

Al tocarla:

- acelera durante 1–2 segundos;
- consume la carga;
- recupera lentamente.

Agrega estrategia sin necesitar power-ups complejos.

---

# 23. Draft / rebufo — opcional

Si un auto permanece detrás de otro durante algunos segundos puede ganar un pequeño boost.

Puede generar adelantamientos interesantes sin agregar botones adicionales.

---

# 24. Penalizaciones

Pueden existir reglas simples:

- salir de pista → reducción de velocidad;
- cortar camino → vuelta inválida;
- falsa largada → pequeña penalización;
- quedar trabado → respawn.

Evitar penalizaciones difíciles de comprender.

---

# 25. Variantes de juego

El motor debería idealmente permitir distintos modos de competencia.

## Race

Primero en completar X vueltas.

## Time Attack

Todos intentan hacer la vuelta más rápida.

## Elimination

Cada cierta cantidad de segundos se elimina el último.

## Survival

La pista se vuelve progresivamente más difícil.

## Knockout Tournament

Ganadores avanzan a una siguiente ronda.

Esto permitiría reutilizar la misma plataforma para diferentes eventos.

---

# 26. Torneos

Para eventos largos podría existir modo torneo.

Ejemplo:

- Heat 1;
- Heat 2;
- Heat 3;
- semifinal;
- final.

El sistema mantiene automáticamente:

- jugadores;
- resultados;
- clasificación;
- bracket.

---

# 27. Personalización de marca

El sistema debería estar pensado como producto white-label.

Configurables por evento:

- logo;
- colores;
- tipografías;
- nombre del juego;
- fondo;
- diseño del auto;
- assets de pista;
- carteles publicitarios;
- sonidos;
- pantalla de ganador;
- premio;
- QR;
- dominio/subdominio.

Ejemplo:

`race.brand.com`

Esto permitiría reutilizar el mismo engine para distintos clientes.

---

# 28. Skins de vehículos

Cada marca podría utilizar vehículos específicos:

- autos;
- motos;
- zapatillas;
- botellas;
- latas;
- productos;
- personajes.

El sistema de carrera debería separar lógica de juego y assets visuales.

---

# 29. Personalización de pista

Debería ser posible modificar:

- textura;
- recorrido;
- branding;
- obstáculos;
- cartelería;
- fondo;
- elementos 3D o 2D.

Idealmente sin modificar la lógica principal del juego.

---

# 30. Fotos / social sharing — opcional

Al terminar:

`Compartí tu resultado`

Generar automáticamente una imagen con:

- nombre;
- posición;
- tiempo;
- branding;
- mensaje del evento.

Ejemplo:

`Agus terminó #1 en Brand Racing Challenge`

Esto puede aumentar alcance orgánico.

---

# 31. Captura de datos — opcional

Dependiendo del evento, antes de jugar se podría pedir:

- nombre;
- email;
- teléfono;
- edad;
- consentimiento de marketing.

Pero debería ser completamente configurable.

Para experiencias de alto flujo conviene pedir solamente nombre.

---

# 32. Anti-nombres inapropiados

Si los nombres aparecen en pantalla pública debería existir moderación.

Opciones:

- filtro automático de palabras prohibidas;
- lista de términos bloqueados configurable;
- posibilidad de que el operador cambie/elimine un nombre.

---

# 33. Reconexión

Muy importante para eventos.

Si un jugador:

- minimiza el navegador;
- cambia de red;
- pierde Wi-Fi;
- refresca la página;

el sistema debería intentar reconectarlo a la misma sesión.

El usuario debería conservar:

- nombre;
- auto;
- partida;
- estado.

Se puede guardar un identificador de sesión en localStorage/sessionStorage.

---

# 34. Latencia

La sensación del control debe ser inmediata.

Para input de conducción conviene utilizar comunicación en tiempo real, por ejemplo:

- WebSocket;
- Socket.IO;
- WebRTC DataChannel, si existe una razón concreta.

Evitar requests HTTP tradicionales para acelerador/freno/dirección.

Objetivo ideal dentro de una red local:

`input → reacción visual < 50–100 ms`.

---

# 35. Red local / funcionamiento offline

Para eventos profesionales sería muy recomendable que el sistema pueda funcionar sin depender de Internet.

Arquitectura posible:

- router Wi-Fi propio;
- computadora principal ejecutando el servidor;
- celulares conectados a esa Wi-Fi;
- pantalla principal conectada a la misma red;
- URL local para controllers.

Internet puede utilizarse para analítica o sincronización, pero la carrera no debería depender de él.

---

# 36. QR dinámico

El QR debería apuntar automáticamente a la sesión activa.

Ejemplo conceptual:

`race.local/join/ABCD`

Esto evita que un usuario termine en una partida anterior o incorrecta.

---

# 37. Código manual alternativo

En caso de problemas con cámara/QR:

Mostrar:

`Entrá a race.brand.com`

`Código: 4832`

Esto mejora mucho la operación real.

---

# 38. Panel de operador

Debe existir una interfaz separada para el staff.

Funciones recomendadas:

- crear nueva partida;
- iniciar carrera;
- cancelar carrera;
- reiniciar carrera;
- ver jugadores conectados;
- expulsar jugador;
- cambiar nickname;
- marcar jugador como listo;
- configurar cantidad de vueltas;
- configurar máximo de jugadores;
- activar/desactivar colisiones;
- activar/desactivar audio;
- activar/desactivar vibración;
- seleccionar pista;
- resetear ranking;
- ver estado de conexiones.

---

# 39. Auto-start

Modo opcional para experiencias sin operador.

Ejemplo:

- mínimo 2 jugadores;
- máximo 6;
- cuando hay al menos 2 jugadores listos iniciar countdown de 15 segundos;
- nuevos jugadores pueden ingresar hasta que termine el countdown;
- iniciar automáticamente.

Esto permitiría que la instalación funcione de forma autónoma.

---

# 40. Timeout de lobby

Evitar que un jugador bloquee una partida eternamente.

Ejemplo:

- jugador conectado pero sin actividad durante 60 segundos → remover;
- jugador no listo → advertencia;
- conexión perdida → reservar lugar durante 10–20 segundos.

---

# 41. Estado del jugador

Definir estados claros del lado del servidor:

```text
CONNECTED
NAMED
READY
COUNTDOWN
RACING
FINISHED
DISCONNECTED
SPECTATING
QUEUED
```

Esto simplifica mucho la lógica multiplayer.

---

# 42. Estado de la partida

Definir estados claros:

```text
LOBBY
COUNTDOWN
RACING
FINISHED
RESULTS
RESETTING
```

Toda la UI debería derivarse del estado real del servidor.

---

# 43. Servidor autoritativo

Recomendado:

El servidor debería ser la fuente de verdad para:

- estado de carrera;
- posición;
- vueltas;
- resultados;
- ganador;
- timestamps;
- premios.

No confiar en el navegador del jugador para definir resultados.

Esto evita inconsistencias y posibles trampas.

---

# 44. Sincronización temporal

Los tiempos deberían calcularse del lado del servidor con un reloj común.

Evitar depender del reloj de cada celular.

Guardar:

- raceStartTimestamp;
- lap timestamps;
- finish timestamp.

---

# 45. Telemetría básica

Guardar estadísticas por carrera:

```text
raceId
playerId
nickname
position
finishTime
bestLap
laps
collisions
offTrackCount
boostUses
connectionDrops
```

Aunque inicialmente no se muestren, permiten evolucionar la experiencia.

---

# 46. Analytics del evento

Dashboard opcional:

- partidas jugadas;
- jugadores únicos;
- jugadores totales;
- tiempo medio de partida;
- tiempo medio de espera;
- porcentaje de usuarios que vuelven a jugar;
- récord del día;
- premios entregados;
- horas de mayor uso.

Esto agrega mucho valor comercial a la plataforma para eventos.

---

# 47. Sonido de la pantalla principal

Además del sonido individual del celular, la pantalla general debería tener audio ambiente.

Ejemplos:

- motores;
- countdown;
- golpes;
- última vuelta;
- adelantamientos importantes;
- victoria;
- récord.

Debe existir control de volumen desde el panel de operador.

---

# 48. Announcer / locutor virtual — opcional

Una evolución divertida:

`¡Juan acaba de pasar al primer lugar!`

`¡Última vuelta!`

`¡Nuevo récord de pista!`

Puede hacerse con clips pregrabados o TTS.

No es necesario para MVP.

---

# 49. Visual feedback en pantalla grande

Agregar eventos visuales importantes:

- cambio de líder;
- choque fuerte;
- turbo;
- última vuelta;
- récord;
- ganador.

El objetivo es que incluso las personas que miran entiendan rápidamente qué está ocurriendo.

---

# 50. Cámara dinámica — opcional

En vez de mantener siempre la misma vista completa, se podrían introducir:

- pequeños zooms;
- seguimiento del líder;
- cámara especial al llegar;
- replay corto del final.

Debe usarse con cuidado para no dificultar la conducción.

---

# 51. Replay de llegada — opcional

Guardar los últimos segundos de estado de la carrera y reproducir una pequeña repetición cuando dos jugadores llegan muy juntos.

Ejemplo:

`PHOTO FINISH`

Puede ser muy divertido para eventos competitivos.

---

# 52. Empate / photo finish

Definir explícitamente cómo resolver diferencias muy pequeñas.

Mostrar tiempos con milisegundos si es necesario.

Ejemplo:

`42.381`

vs

`42.416`

---

# 53. Dificultad adaptativa — opcional

Para experiencias familiares podría existir una asistencia configurable:

- auto-steering ligero;
- límite de salida de pista;
- recuperación rápida;
- pequeñas ayudas a jugadores muy retrasados.

Puede permitir que niños y adultos jueguen juntos.

---

# 54. Rubber banding — opcional

Mecánica arcade:

Los jugadores muy atrás reciben un pequeño beneficio de velocidad y el líder un beneficio menor.

Esto mantiene las carreras más parejas y emocionantes.

Debe ser configurable porque en una competencia seria puede no ser deseable.

---

# 55. Accesibilidad

Considerar:

- botones grandes;
- alto contraste;
- no depender solamente del color;
- vibración opcional;
- sonido opcional;
- controller utilizable con una sola mano si la mecánica lo permite;
- landscape/portrait claramente definido.

---

# 56. Orientación del celular

Definir explícitamente si el controller funciona en:

- portrait;
- landscape.

Si requiere landscape, mostrar overlay:

`Gir&aacute; tu celular para jugar`.

Bloquear visualmente la interfaz hasta que esté correctamente orientado.

---

# 57. Evitar scroll y gestos del navegador

Durante la carrera el controller debería comportarse como una app.

Evitar:

- scroll accidental;
- pull-to-refresh;
- selección de texto;
- zoom accidental;
- menú contextual;
- gestos que interfieran con los controles.

Usar correctamente `touch-action`, `preventDefault` donde corresponda y CSS de pantalla completa.

---

# 58. Wake lock

Cuando esté soportado utilizar Screen Wake Lock API para evitar que la pantalla del celular se apague durante una partida.

Fallback normal si no está disponible.

---

# 59. Fullscreen / PWA — opcional

No exigir instalación.

Pero podría configurarse como PWA para instalaciones permanentes.

Para eventos temporales la experiencia principal debería funcionar completamente desde navegador.

---

# 60. Soporte de dispositivos

Definir una matriz mínima de compatibilidad.

Prioridad sugerida:

- iOS Safari moderno;
- Android Chrome moderno.

Antes de cada evento debería existir una página automática de diagnóstico que compruebe:

- WebSocket;
- WebAudio;
- orientación;
- vibración;
- wake lock;
- resolución;
- conexión.

---

# 61. Pantalla de conexión problemática

Si la latencia aumenta o se pierde la conexión:

Mostrar en celular:

`Reconectando…`

En vez de simplemente dejar de responder.

En pantalla/operador indicar:

`Juan — conexión inestable`.

---

# 62. Preload de assets

Antes de habilitar `LISTO`, precargar:

- sonidos;
- imágenes;
- sprites;
- modelos;
- fuentes críticas.

Mostrar progreso si fuera necesario.

Esto evita lag durante la carrera.

---

# 63. Configuración por JSON / archivo de evento

Idealmente cada evento debería poder definirse con una configuración sin cambiar código.

Ejemplo conceptual:

```json
{
  "eventName": "Brand Racing Challenge",
  "maxPlayers": 6,
  "laps": 3,
  "collisions": true,
  "boost": true,
  "dailyLeaderboard": true,
  "prizes": true,
  "theme": "brand-x"
}
```

Esto vuelve al sistema escalable como producto.

---

# 64. Logs técnicos

Registrar eventos importantes:

- connect;
- disconnect;
- join;
- ready;
- race start;
- lap;
- finish;
- reconnect;
- error.

Permitir descargar logs desde el panel técnico.

En un evento presencial esto ayuda muchísimo a diagnosticar problemas.

---

# 65. Modo técnico / health dashboard

Pantalla oculta para técnicos con:

- FPS de visualización;
- ping de cada jugador;
- cantidad de sockets;
- memoria;
- CPU;
- estado servidor;
- estado red;
- errores recientes;
- versión del build.

---

# 66. Botón de emergencia / reset

El operador necesita siempre poder:

`STOP RACE`

`RESET GAME`

sin reiniciar manualmente el navegador o el servidor.

---

# 67. Recuperación automática

Si la pantalla principal se recarga debería recuperar la sesión actual desde el servidor.

No perder el estado completo por un refresh accidental.

Si el servidor se reinicia entre carreras debería poder volver automáticamente a un estado operativo limpio.

---

# 68. Demo mode

Cuando nadie juega, la pantalla puede mostrar una carrera automática con bots.

Esto sirve para:

- atraer público;
- demostrar inmediatamente cómo funciona;
- evitar una pantalla estática.

Al conectarse un jugador el demo se detiene.

---

# 69. Bots — opcional

Permitir completar posiciones con bots.

Ejemplo:

Hay 2 personas pero la pista soporta 6 autos.

Se pueden agregar 4 bots.

Debe ser configurable.

---

# 70. Attract mode

Cuando está idle alternar:

- demo gameplay;
- ranking;
- QR;
- instrucciones;
- branding;
- premios disponibles.

Ejemplo:

`ESCANEÁ — CORRÉ — GANÁ`

---

# 71. Instrucciones extremadamente cortas

No usar tutoriales largos.

Ideal:

`ACELERÁ`

`FRENÁ`

`GANÁ 3 VUELTAS`

Si existe dirección por inclinación:

`INCLINÁ EL CELULAR PARA GIRAR`.

La primera partida debería ser comprensible en segundos.

---

# 72. Tutorial interactivo en celular

Antes de la primera carrera puede haber una prueba de 5 segundos:

`Mantené apretado para acelerar`

Cuando lo hace:

`Perfecto.`

`Ahora frená.`

Luego:

`LISTO PARA CORRER`.

Debe poder desactivarse para jugadores recurrentes.

---

# 73. Countdown de próxima partida

Después del resultado:

`Próxima carrera en 20 segundos`

Esto ayuda a mantener ritmo operativo.

---

# 74. Duración configurable

Desde administrador poder definir:

- cantidad de vueltas;
- duración máxima;
- countdown;
- tiempo de resultados;
- tiempo de lobby.

Así puede adaptarse la experiencia según cantidad de público.

---

# 75. Capacidades recomendadas de jugadores

No asumir cantidad ilimitada.

Definir explícitamente y testear:

- 2 jugadores;
- 4 jugadores;
- 6 jugadores;
- 8 jugadores;
- posiblemente 10+.

La cantidad máxima depende tanto de performance como de legibilidad visual de la pista.

---

# 76. Layout dinámico de la visualización

Actualmente la pantalla se divide según cantidad de celulares.

Conviene definir reglas visuales por cantidad de jugadores.

Ejemplo:

```text
1 jugador → 1 viewport
2 jugadores → 2 columnas
3 jugadores → 1 grande + 2 pequeñas o grilla
4 jugadores → 2 × 2
5–6 jugadores → 3 × 2
7–8 jugadores → 4 × 2
```

Sin embargo, vale evaluar una alternativa mucho más atractiva para eventos:

### Cámara compartida

Todos los autos corren dentro de **una única pista/cámara compartida**.

Ventajas:

- es mucho más fácil entender quién está adelante;
- se ve la interacción entre autos;
- las colisiones son visibles;
- ocupa mejor una pantalla grande;
- espectadores pueden seguir la carrera;
- genera sensación real de competencia.

Si técnicamente es posible, esta debería considerarse seriamente como dirección principal del producto.

---

# 77. Recomendación sobre pantalla dividida vs cámara compartida

Si cada jugador necesita información diferente, la pantalla dividida tiene sentido.

Pero para una activación competitiva, probablemente sea mejor:

- **pantalla grande:** vista general compartida de todos los autos;
- **celular:** información individual y controles.

El celular puede mostrar:

- posición;
- vuelta;
- turbo;
- velocidad;
- feedback de golpes.

De esta forma se libera a la pantalla principal para que funcione como espectáculo.

---

# 78. Información en el controller durante carrera

Mantenerla mínima:

```text
AGUS
2° / 6
VUELTA 2 / 3

[ FRENO ]    [ ACELERAR ]
```

Opcional:

```text
BOOST 72%
```

Evitar pequeños elementos que requieran lectura durante la carrera.

---

# 79. Emotes — opcional

Agregar 3–4 reacciones rápidas que aparezcan sobre el auto:

- 😎
- 😂
- 😡
- 👋

Pueden dar una capa social sin afectar gameplay.

Debe haber cooldown para evitar spam.

---

# 80. Celebración del ganador

La victoria debería sentirse importante.

En pantalla:

- confetti;
- zoom al auto;
- nombre grande;
- sonido;
- podio.

En celular:

- animación;
- sonido;
- vibración si está disponible;
- información del premio.

---

# 81. Premios aleatorios — opcional

Además de premiar al ganador se puede configurar:

`Cada 20 partidas, un participante recibe un premio sorpresa.`

Esto puede mantener interés incluso de jugadores menos competitivos.

Debe mostrarse claramente para no generar confusión sobre reglas.

---

# 82. Challenges del día

Opcional:

- `Gan&aacute; sin chocar`;
- `Hac&eacute; una vuelta menor a 15 s`;
- `Us&aacute; 3 boosts`;
- `Romp&eacute; el récord`.

Puede vincularse a premios.

---

# 83. Arquitectura conceptual sugerida

```text
                ┌──────────────────────┐
                │      Game Server     │
                │                      │
                │ sessions             │
                │ players              │
                │ race state           │
                │ timing               │
                │ results              │
                └──────────┬───────────┘
                           │ WebSocket
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Player 1          Player 2         Player N
     Mobile Web        Mobile Web       Mobile Web

                           │
                           ▼
                ┌──────────────────────┐
                │    Main Display      │
                │ race visualization   │
                │ leaderboard          │
                └──────────────────────┘

                           │
                           ▼
                ┌──────────────────────┐
                │    Operator Panel    │
                └──────────────────────┘
```

---

# 84. Prioridades de desarrollo

## FASE 1 — Convertir el prototipo en un juego real

**Prioridad máxima.**

Implementar:

- lobby;
- nickname;
- identificación auto/color;
- ready;
- countdown;
- línea de largada/meta;
- vueltas;
- detección de posición;
- cronómetro;
- detección de ganador;
- scoreboard final;
- botón volver a jugar;
- reset de carrera;
- reconexión básica.

Sin esto todavía es una demo técnica y no una experiencia competitiva.

---

# 85. FASE 2 — Hacerlo divertido

Agregar:

- audio en celular;
- audio general;
- feedback visual del controller;
- colisiones;
- penalización al salir de pista;
- respawn;
- última vuelta;
- efectos de victoria;
- mejor vuelta;
- récord del evento;
- leaderboard diario;
- turbo.

---

# 86. FASE 3 — Hacerlo sólido para eventos

Agregar:

- panel de operador;
- cola de jugadores;
- auto-start;
- funcionamiento offline/LAN;
- health dashboard;
- reconexión robusta;
- logs;
- QR dinámico;
- código manual;
- configuración por evento;
- control de duración;
- preload de assets;
- modo attract/demo.

---

# 87. FASE 4 — Producto comercial reusable

Agregar:

- white-label completo;
- skins;
- múltiples pistas;
- analytics;
- premios;
- validación de premios;
- captura de datos;
- torneos;
- diferentes modos de juego;
- social sharing;
- exportación de resultados.

---

# 88. FASE 5 — Funcionalidades experimentales

Evaluar:

- power-ups;
- bots;
- rubber banding;
- announcer;
- replay;
- photo finish;
- emotes;
- challenges;
- torneos avanzados;
- IA para comentar carreras.

---

# 89. MVP recomendado para el próximo build

Si hubiera que elegir solamente las funcionalidades que producen el salto más grande respecto del prototipo actual, implementar en este orden:

1. nickname al ingresar;
2. asignación clara de jugador/color;
3. lobby;
4. botón Ready;
5. countdown sincronizado;
6. línea de meta;
7. contador de vueltas;
8. cálculo de posición;
9. timer;
10. detección automática de ganador;
11. scoreboard final;
12. resultado individual en celular;
13. feedback sonoro del controller;
14. colisiones simples;
15. respawn automático;
16. ranking de mejores tiempos;
17. panel mínimo de operador;
18. reconexión automática.

Con estos puntos el sistema ya puede empezar a sentirse como un producto de eventos y no solamente como un experimento multiplayer.

---

# 90. Principios de UX para todo el desarrollo

## A. Cero explicación

Una persona debería poder entender cómo jugar mirando durante pocos segundos.

## B. Cero instalación

QR → navegador → jugar.

## C. Feedback instantáneo

Cada acción del jugador debe generar una respuesta inmediata.

## D. Partidas cortas

Idealmente 30–90 segundos.

## E. Resultado inequívoco

Siempre debe quedar claro:

- quién ganó;
- quién quedó segundo;
- cuánto tardó;
- cuándo empieza la próxima carrera.

## F. Recuperación automática

En un evento real cualquier falla debe tender a autorrepararse sin intervención técnica.

## G. La pantalla grande es espectáculo

No debería comportarse solamente como monitor técnico del juego. Debe atraer gente y hacer visible la competencia.

## H. El teléfono es el control personal

Utilizarlo para:

- input;
- feedback;
- información individual;
- premios;
- revancha.

---

# 91. Dirección recomendada de producto

El concepto más fuerte podría resumirse así:

> **Una plataforma multiplayer instantánea para eventos donde cualquier persona convierte su celular en un controller simplemente escaneando un QR.**

La carrera de autos sería el primer juego, pero conviene diseñar la arquitectura para que posteriormente la misma infraestructura pueda soportar otros juegos.

Ejemplos futuros:

- carreras;
- trivia;
- pong multiplayer;
- carreras de personajes;
- competencia de reflejos;
- fútbol simple;
- juegos de puntería;
- votaciones competitivas;
- experiencias de marca.

Por eso sería recomendable separar desde ahora:

```text
Multiplayer Platform
    ├── Session Manager
    ├── Player Manager
    ├── Mobile Controller
    ├── Main Display
    ├── Operator Panel
    ├── Leaderboard
    └── Games
          └── Racing Game
```

Así el trabajo realizado en conexión QR, sesiones, jugadores, rankings y operator panel puede reutilizarse en futuras activaciones.

---

# 92. Criterio general

Antes de agregar mecánicas complejas, priorizar siempre esta secuencia:

```text
FUN > CLARITY > RELIABILITY > FEATURES
```

Para eventos es preferible un juego extremadamente simple que responde perfectamente y genera competencia a uno con muchas funciones pero difícil de entender o inestable.
