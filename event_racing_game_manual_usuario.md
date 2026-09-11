# Event Racing Game - Manual de usuario y configuracion

Este manual describe como ejecutar, operar y ajustar el proyecto actual. Los cambios de configuracion se dividen entre el servidor local, el controller web y la escena de PlayCanvas.

## 1. Estructura del proyecto

### Archivos locales

- `carreras/server.js`: servidor HTTP, WebSocket, jugadores, lobby, countdown y resultados.
- `carreras/public/controller.html`: interfaz que se abre en cada celular.
- `carreras/public/operator.html`: panel de control para el staff.
- `carreras/public/manifest.webmanifest`: configuracion PWA y fullscreen.
- `carreras/public/service-worker.js`: soporte minimo de instalacion PWA.
- `carreras/test/integration.js`: prueba automatizada del protocolo principal.
- `audiomass-output.mp3`: sonido de motor servido localmente al controller.
- `carreras/package.json`: dependencias y comando de inicio.
- `event_racing_game_recomendaciones.md`: recomendaciones originales del producto.
- `event_racing_game_checklist.md`: estado actual y tareas pendientes.
- `event_racing_game_manual_usuario.md`: este manual.

### Elementos principales en PlayCanvas

- Entidad `Root`: contiene los scripts generales.
- Script `localMultiplayer`: conecta la pantalla con el servidor y crea autos/camaras.
- Script `raceManager`: administra parrilla, vueltas, tiempos, posiciones y resultados.
- Script `raceProgressReporter`: informa al servidor el avance de cada auto para ordenar a quienes no terminan.
- Script `viewportFrames`: dibuja marcos, etiquetas y asigna materiales.
- Script `raceAnnouncements`: muestra la ultima vuelta y anuncia inmediatamente al ganador.
- Script `raceTelemetry`: calcula velocidad, informa telemetria y detecta el salto de respawn.
- Entidad `Player Car`: auto base que se clona para los demas jugadores.
- Script `arcadeCar`: movimiento, velocidad en asfalto/cesped y seguimiento de camara.
- Template `car_1`: modelo visual importado desde `car_1.fbx`.

## 2. Puesta en marcha

### Requisitos

- Node.js instalado.
- Computadora y celulares conectados a la misma red Wi-Fi.
- Proyecto abierto en PlayCanvas.
- Firewall de Windows permitiendo conexiones al puerto `8080`.

### Instalar dependencias

Desde `carreras`:

```powershell
npm install
```

### Iniciar el servidor

```powershell
npm start
```

La consola mostrara una URL similar a:

```text
Totem controller: http://192.168.1.20:8080/controller
```

No cerrar esa terminal durante el evento.

### Iniciar la pantalla principal

1. Abrir el proyecto en PlayCanvas.
2. Confirmar que los atributos `serverUrl` apunten a `ws://localhost:8080`.
3. Ejecutar Play.
4. Confirmar que el QR aparezca arriba a la izquierda.

### Ingresar desde un celular

1. Conectar el celular a la misma red Wi-Fi.
2. Escanear el QR.
3. Escribir un nombre de hasta 16 caracteres.
4. Pulsar `CONTINUAR`.
5. Los jugadores `P2-P4` pulsan `LISTO`.
6. `P1` pulsa `INICIAR CARRERA` cuando todos estan listos.

## 3. Flujo actual de una carrera

1. El servidor acepta hasta 4 jugadores.
2. Cada jugador recibe numero, color y auto.
3. Los autos se colocan antes de la linea de salida.
4. `P1` o el operador inicia la carrera.
5. Aparece una cuenta regresiva de 5 segundos por defecto.
6. Los autos quedan bloqueados hasta `YA!`.
7. Cada jugador completa 3 vueltas por defecto.
8. La pantalla actualiza posiciones usando vueltas y progreso.
9. Al comenzar la ultima vuelta configurada, pantalla y celular muestran `ULTIMA VUELTA` con feedback audiovisual.
10. El primer jugador que completa la cantidad configurada de vueltas se anuncia inmediatamente como ganador.
11. Cuando llega el ganador comienza un limite final de 15 segundos por defecto.
12. Cada jugador recibe su resultado al terminar o al agotarse el limite.
13. Quienes no terminan se ordenan por vueltas y progreso dentro de la vuelta.
14. Cuando terminan todos o vence el limite, se muestra el podio.
15. Despues de 12 segundos por defecto el sistema vuelve al lobby.

Los valores de vueltas, countdown, limite final y duracion de resultados pueden modificarse desde `/operator` mientras la partida esta en lobby.

## 4. Parametros del servidor

Archivo: `carreras/server.js`.

Los cambios en este archivo requieren detener el servidor con `Ctrl+C` y ejecutar nuevamente `npm start`.

### Puerto

El puerto se obtiene de `PORT` o usa `8080`:

```js
const port = Number(process.env.PORT) || 8080;
```

Para iniciar temporalmente en otro puerto:

```powershell
$env:PORT=8081
npm start
```

Si se cambia el puerto, tambien deben actualizarse los atributos `serverUrl` en PlayCanvas.

### Cantidad de vueltas

Buscar:

```js
let totalLaps = 3;
```

Cambiar `3` por la cantidad deseada. Mantener sincronizado el atributo `totalLaps` de `raceManager` en PlayCanvas.

### Maximo de jugadores

Actualmente el servidor busca lugares de `P1` a `P4` y rechaza valores mayores a 4. Para aumentar el limite no alcanza con modificar el servidor: tambien deben ampliarse parrilla, colores, viewports y materiales en PlayCanvas.

### Countdown

La duracion se guarda en:

```js
let countdownSeconds = 5;
```

Puede cambiarse desde `/operator` sin reiniciar el servidor mientras la partida esta en lobby.

### Duracion de resultados

El regreso al lobby utiliza:

```js
let resultsDurationSeconds = 12;
```

Tambien puede cambiarse desde `/operator` y se expresa en segundos.

### Tiempo limite despues del ganador

El limite final se configura en segundos:

```js
let finishTimeoutSeconds = 15;
```

Al agotarse, el servidor asigna las posiciones restantes usando el ultimo progreso informado por PlayCanvas.

### Longitud del nombre

Los nombres se limitan con:

```js
.slice(0, 16)
```

Si se modifica, cambiar tambien `maxlength="16"` en `controller.html`.

## 5. Configuracion del controller

Archivo: `carreras/public/controller.html`.

Los cambios visuales se ven al recargar el navegador del celular. En algunos dispositivos puede ser necesario cerrar la pestaña y volver a escanear el QR.

### Colores del celular

Buscar:

```js
const playerColors = ['#e53935', '#1687ff', '#ffd21f', '#24c96b'];
```

El orden corresponde a `P1`, `P2`, `P3` y `P4`.

Si se cambia un color, actualizar tambien:

- Los materiales `Material.car2.P1-P4` en PlayCanvas.
- El arreglo `colors` del script `viewportFrames`.

### Sonido y volumen del motor

El motor del celular utiliza `audiomass-output.mp3`, servido localmente como `/engine.mp3`. El archivo se precarga, se decodifica con Web Audio y se reproduce en loop mientras el jugador mantiene presionado `ACELERAR`.

No se aloja en PlayCanvas porque pertenece al controller web y debe funcionar dentro de la red local sin depender de Internet.

El volumen se configura en `playEngineBuffer`, dentro de `controller.html`:

```js
gain.gain.value = 1;
```

El rango permitido es de `0` a `1`.

### Vibracion de choque

Buscar en `collisionFeedback`:

```js
navigator.vibrate([280, 70, 280, 70, 420]);
```

Los valores alternan vibracion y pausa, en milisegundos.

La vibracion web no esta garantizada. En particular, iPhone/Safari normalmente no soporta `navigator.vibrate()`. El flash visual funciona como alternativa.

### Texto de botones y resultados

Los textos visibles estan dentro del HTML y en las funciones:

- `showPersonalResult`.
- Manejador de mensajes WebSocket.
- Boton `ready`.
- Boton `save-name`.

### Orientacion del celular

El controller solo permite jugar en horizontal. En vertical oculta toda la interfaz, muestra `GIRA EL TELEFONO PARA JUGAR` y envia controles neutros para que el auto no conserve una entrada presionada.

### Pantalla completa en Android y iOS

El controller intenta activar la Fullscreen API desde los botones `CONTINUAR`, `LISTO` y `PANTALLA COMPLETA`. En Android Chrome esto oculta las barras del navegador durante el juego y solicita mantener la orientacion horizontal cuando el dispositivo lo permite.

En iPhone y iPad, Safari no permite ocultar permanentemente su interfaz mediante JavaScript. Para utilizar la experiencia sin la barra del navegador:

1. Abrir el controller en Safari.
2. Pulsar `PANTALLA COMPLETA` para ver las instrucciones.
3. Usar `Compartir > Agregar a pantalla de inicio`.
4. Abrir `Bermuda Racing` desde el icono creado.

El proyecto incluye `manifest.webmanifest`, metadatos Apple, icono de aplicacion y un service worker minimo. En modo instalado se abre directamente en fullscreen horizontal. La instalacion PWA completa de Android requiere HTTPS; sobre una URL HTTP de red local se mantiene disponible el fullscreen nativo iniciado por el usuario.

### Reconexion del jugador

El controller guarda un identificador de sesion en `localStorage`. Si la pagina se recarga o el WebSocket se interrumpe, intenta recuperar automaticamente el mismo nombre, numero, color y auto.

El servidor reserva el puesto durante 15 segundos. Durante ese periodo el auto recibe controles neutros pero permanece en la carrera. Si el jugador no regresa antes del limite, el puesto se libera y se aplica el comportamiento normal de desconexion.

La reserva se configura en `server.js`:

```js
const reconnectGraceSeconds = 15;
```

### Ultima vuelta y ganador

Cuando un jugador comienza la tercera y ultima vuelta:

- su celular muestra `ULTIMA VUELTA`;
- reproduce una senal sintetizada;
- vibra cuando el navegador lo soporta;
- la pantalla principal muestra `ULTIMA VUELTA - NOMBRE`.

El primer jugador que cruza la meta despues de las 3 vueltas recibe inmediatamente `GANASTE!` y su resultado personal. Los demas celulares y la pantalla principal muestran `NOMBRE GANA!` sin esperar el timeout de cierre.

### Posicion y velocidad

Durante la carrera el celular muestra:

- posicion actual respecto de los participantes;
- velocidad aproximada en `KM/H`;
- vuelta actual dentro del estado superior.

La posicion se calcula en el servidor con vueltas y progreso. El script `raceTelemetry` obtiene la velocidad a partir del desplazamiento real de cada auto y la envia cada `0.25` segundos.

## 6. Panel de operador

Abrir desde la computadora del evento:

```text
http://localhost:8080/operator
```

Desde otro equipo de la red utilizar:

```text
http://IP-DE-LA-PC:8080/operator
```

Funciones disponibles:

- iniciar cuando todos los jugadores estan listos;
- detener inmediatamente una carrera o countdown;
- reiniciar al lobby conservando los jugadores conectados;
- expulsar un jugador;
- ver nombre, conexion y estado listo;
- configurar vueltas;
- configurar duracion del countdown;
- configurar timeout posterior al ganador;
- configurar duracion de resultados.

La configuracion solo puede editarse en lobby. Los valores se mantienen en memoria hasta reiniciar el servidor.

## 7. Configuracion de autos en PlayCanvas

### Entidad base

Seleccionar `Root > Player Car`.

La entidad se usa como base para todos los clones. Todo hijo visual agregado dentro de `Player Car` sera clonado para `P2-P4`.

### Modelo actual

Jerarquia:

```text
Player Car
└── car_1
    ├── car2
    ├── whell
    ├── whell.001
    ├── whell.002
    └── whell.003
```

La carroceria anterior de bloques sigue en la jerarquia, pero sus componentes Render estan desactivados.

### Cambiar el modelo

1. Importar el FBX o GLB en Assets.
2. Crear o usar el Template generado por PlayCanvas.
3. Instanciarlo como hijo de `Player Car`.
4. Ajustar posicion, rotacion y escala local.
5. Desactivar o eliminar visuales anteriores solo despues de verificar el nuevo modelo.
6. Actualizar los nombres buscados por `viewportFrames` si la carroceria o ruedas tienen otros nombres.

La entidad `Player Car` debe conservar el script `arcadeCar` aunque se cambie el modelo visual.

### Colores de autos

Materiales actuales:

- `Material.car2.P1`: rojo.
- `Material.car2.P2`: azul.
- `Material.car2.P3`: amarillo.
- `Material.car2.P4`: verde.
- `CarDark`: ruedas.

Editar el valor Diffuse del material correspondiente en PlayCanvas. No cambiar los nombres sin actualizar `viewportFrames`.

## 8. Movimiento y cesped

Seleccionar `Root > Player Car > Script > arcadeCar`.

### Parametros actuales

| Parametro | Valor | Funcion |
| --- | ---: | --- |
| `maxSpeed` | 35 | Velocidad maxima sobre asfalto. |
| `acceleration` | 20 | Rapidez para acelerar y desacelerar. |
| `steerSpeed` | 125 | Velocidad de giro. |
| `grassSpeedMultiplier` | 0.50 | Porcentaje de velocidad disponible en cesped. |

Ejemplos:

- Mas velocidad: subir `maxSpeed` gradualmente.
- Giro mas suave: bajar `steerSpeed` de `125` a `105`.
- Cesped mas lento: bajar `grassSpeedMultiplier` de `0.50` a `0.25`.
- Cesped menos severo: subirlo a `0.30`.

### Deteccion de asfalto

La deteccion principal proyecta la posicion de cada auto sobre los triangulos de la malla. La superficie se considera asfalto cuando el punto del auto queda dentro de uno de esos triangulos.

La entidad actual es `sm_F1AR_pista > pista` y tiene:

- Tag `asphalt`.
- Render asset `306017766`.

Este metodo no necesita Ammo.js, Collision ni Rigidbody. Para una pista nueva, colocar el tag `asphalt` sobre la entidad Render que representa su superficie transitable.

La malla de colision deberia ser simple, tener un espesor vertical aproximado de `0.1` a `0.3` unidades y exportarse con transformaciones aplicadas cuando sea posible.

## 9. Camara

Los parametros se encuentran en `Player Car > Script > arcadeCar`.

| Parametro | Valor | Funcion |
| --- | ---: | --- |
| `cameraHeight` | 18 | Altura de la camara. |
| `cameraDistance` | 12 | Separacion horizontal fija. |
| `cameraOrthoHeight` | 21 | Cantidad de pista visible. |
| `cameraSmoothness` | 0.3 | Suavizado del seguimiento. |

Para ver mas pista, subir `cameraOrthoHeight`. Para acercar la vista, bajarlo.

La camara usa una orientacion mundial fija para evitar que la pista rote al doblar.

## 10. Parrilla, vueltas y posiciones

Script: `raceManager` en la entidad `Root`.

### Parrilla

Las posiciones y orientaciones finales de largada se controlan con entidades editables:

```text
Root
└── Race Spawns
    ├── SPAWN_P1
    ├── SPAWN_P2
    ├── SPAWN_P3
    └── SPAWN_P4
```

Durante todo el countdown, `raceTelemetry` copia en cada auto la posicion y rotacion mundial de su marca correspondiente. Para ajustar la largada:

1. mover cada `SPAWN_Pn` al centro del carril deseado;
2. mantener todos los spawns antes de `CP4_FINISH`;
3. rotar cada marca para que apunte en la direccion correcta de carrera;
4. separar las cajas para que los autos no se superpongan;
5. conservar exactamente los nombres `SPAWN_P1-P4`.

La escala de la marca solo modifica su visual y no cambia el tamaño del auto. Despues de acomodarlas puede desactivarse el componente `Render` de cada spawn; no debe desactivarse ni renombrarse la entidad.

El arreglo anterior `positionStartingGrid` de `raceManager` sigue funcionando como posicion preliminar, pero las marcas `SPAWN_P1-P4` son la referencia final durante el countdown.

### Deteccion de vueltas

Una vuelta se valida cuando:

1. El auto cruza inicialmente la linea.
2. Llega a la zona opuesta con `z > 8`.
3. Vuelve a cruzar desde `x < 0` hasta `x >= 0` con `z < -8`.

Si se rediseña la pista, deben actualizarse esos umbrales.

### Checkpoints antiatajo

Ademas de la deteccion visual de `raceManager`, el servidor valida cada vuelta con cuatro entidades obligatorias y en este orden:

```text
Root
└── Race Checkpoints
    ├── CP1_RIGHT
    ├── CP2_TOP
    ├── CP3_LEFT
    └── CP4_FINISH
```

El script `raceTelemetry` detecta cuando cada auto entra en estas cajas y envia su numero al servidor. Una vuelta solo se suma cuando los cuatro checkpoints se completan en orden. Girar repetidamente cerca de la meta no aumenta vueltas ni permite ganar.

Cada vuelta validada debe durar al menos 5 segundos. Esto evita dobles conteos accidentales y que `ULTIMA VUELTA` aparezca antes de tiempo por entradas anormalmente rapidas en varias marcas.

La deteccion comprueba tanto la posicion actual como el segmento recorrido desde el frame anterior. De esta forma, un auto rapido no puede saltar una marca delgada entre dos frames.

Para acomodarlos manualmente:

1. seleccionar cada entidad dentro de `Root > Race Checkpoints`;
2. moverla hasta que atraviese todo el ancho del asfalto;
3. usar Scale para cubrir la pista sin dejar huecos laterales;
4. rotarla para que quede transversal a la direccion de marcha;
5. conservar los nombres exactos y el orden `CP1`, `CP2`, `CP3`, `CP4`;
6. colocar `CP4_FINISH` sobre la linea de meta.

`CP1_RIGHT`, `CP2_TOP` y `CP3_LEFT` usan el material celeste `Checkpoint.Cyan`. La meta usa el material verde `Checkpoint.Finish`. Despues de acomodarlos puede desactivarse solamente el componente Render para ocultar las marcas durante la carrera; no se debe desactivar ni renombrar la entidad.

Al validar `CP4_FINISH` en el ultimo recorrido configurado, el servidor finaliza directamente a ese jugador y define su posicion. Ya no depende de recibir otro mensaje de llegada de `raceManager`. Si PlayCanvas habia informado la llegada antes de la ultima muestra de telemetria, sus tiempos se conservan. Las vueltas informadas por el cliente no se utilizan como fuente de verdad para la clasificacion.

La deteccion respeta posicion, escala y rotacion de las entidades. Si cambia el trazado basta con mover las cuatro marcas, aunque los calculos de progreso de `raceManager` y `raceProgressReporter` todavia deben revisarse por separado.

### Posiciones

La clasificacion usa:

```text
vueltas completadas + progreso angular dentro del ovalo
```

Los radios de referencia son `34.5` y `19.5`. Deben coincidir aproximadamente con el ovalo de la pista.

El script `raceProgressReporter`, tambien instalado en `Root`, usa estos radios y los mismos umbrales de vuelta para enviar progreso al servidor cada `0.25` segundos. Si se cambia el trazado, actualizar ambos scripts en conjunto.

## 11. Viewports

Script: `viewportFrames` en la entidad `Root`.

Distribucion actual:

- 1 jugador: pantalla completa.
- 2 jugadores: dos columnas.
- 3 jugadores: grilla con tres cuadrantes usados.
- 4 jugadores: grilla `2 × 2`.

El arreglo `colors` define el color de cada marco. Los resultados personales no se muestran sobre los viewports para no tapar el tiempo ni la carrera.

## 12. Resultado final

El servidor recibe desde PlayCanvas:

- jugador;
- tiempo total;
- mejor vuelta.

El orden de llegada define las primeras posiciones. Tras la llegada del ganador hay 15 segundos por defecto para terminar; los autos restantes se ordenan por vueltas validadas y progreso angular. La diferencia se calcula contra el tiempo del ganador.

El resultado se muestra en dos lugares:

- Podio general en la pantalla principal.
- Pantalla personal en el celular.

Actualmente los tiempos de vuelta se calculan en PlayCanvas y el servidor centraliza los resultados. Para una version competitiva resistente a trampas, el servidor deberia calcular directamente los timestamps.

## 13. Solucion de problemas

### Error `EADDRINUSE`

Significa que el puerto `8080` ya esta ocupado.

Consultar el proceso:

```powershell
Get-NetTCPConnection -LocalPort 8080
```

Detener solamente el proceso correcto:

```powershell
Stop-Process -Id <PID>
```

Luego ejecutar `npm start` nuevamente.

### El QR no aparece

1. Confirmar que `npm start` esta activo.
2. Abrir `http://localhost:8080/qr.svg` en la computadora.
3. Confirmar `serverUrl = ws://localhost:8080` en los tres scripts de `Root`.
4. Recargar PlayCanvas Play.

### El celular no conecta

1. Confirmar que usa la misma red Wi-Fi.
2. Probar la URL impresa por el servidor directamente en el celular.
3. Permitir Node.js en el firewall privado de Windows.
4. Desactivar temporalmente VPN o aislamiento de clientes Wi-Fi.

### Los cambios del servidor no aparecen

Los archivos JavaScript del servidor se cargan una sola vez. Detener con `Ctrl+C` y ejecutar otra vez:

```powershell
npm start
```

### Los cambios del controller no aparecen

Recargar la pagina del celular. Si persiste, cerrar la pestaña o borrar la cache del sitio.

### La vibracion no funciona

Es una limitacion del navegador o dispositivo. Android Chrome suele ofrecer soporte. iPhone/Safari normalmente no. El juego debe continuar usando feedback visual y sonoro.

### El auto nuevo no tiene color

1. Confirmar que el modelo sea hijo de `Player Car`.
2. Confirmar que la carroceria se llame `car2`.
3. Confirmar que existan `Material.car2.P1-P4`.
4. Confirmar que `viewportFrames` este activo en `Root`.

### La vuelta no se cuenta

1. Cruzar primero la linea de salida.
2. Recorrer la zona opuesta de la pista.
3. Volver a cruzar en la direccion correcta.
4. Revisar los umbrales de `raceManager` si se modifico la pista.

## 14. Secuencia segura para realizar cambios

1. Cambiar un solo grupo de parametros por vez.
2. Guardar la escena de PlayCanvas.
3. Reiniciar Play para scripts o assets de PlayCanvas.
4. Reiniciar `npm start` para cambios en `server.js`.
5. Recargar los celulares para cambios en `controller.html`.
6. Probar con 1 jugador.
7. Probar con 2 jugadores.
8. Probar con 3 o 4 jugadores antes del evento.
9. Confirmar QR, nombres, ready, countdown, vueltas y resultados.
10. Registrar los valores estables usados en produccion.

### Prueba automatizada del flujo principal

Ejecutar:

```powershell
npm test
```

La prueba levanta temporalmente un servidor aislado en el puerto `18080`, valida la recuperacion de identidad y simula ultima vuelta, checkpoints, llegada y anuncio del ganador con dos jugadores. El proceso de prueba se cierra automaticamente al finalizar.

## 15. Zonas de velocidad

Las primitivas reutilizables estan en:

```text
Root
└── Speed Zones
    ├── BOOST x2 - COPY ME
    └── SLOW x0.5 - COPY ME
```

Para colocar una zona:

1. Duplicar la entidad deseada.
2. Mover la copia sobre la pista.
3. Ajustar su escala visual si es necesario.
4. Mantener el script `speedZone` habilitado.

El script ofrece estos atributos:

| Parametro | Boost | Slow | Funcion |
| --- | ---: | ---: | --- |
| `multiplier` | 2 | 0.5 | Multiplicador aplicado al desplazamiento. |
| `duration` | 0.5 | 0.5 | Duracion del efecto en segundos. |
| `radius` | 2 | 2 | Distancia horizontal de activacion. |

La zona solo se activa durante una carrera. Un auto debe salir del radio antes de poder activarla nuevamente. No utiliza Collision, Rigidbody ni Ammo.js.

### Cambiar el aspecto de una zona

La logica esta en la entidad que contiene `speedZone`, no en la primitiva visual. El cilindro puede reemplazarse por un modelo, sprite o efecto sin cambiar los atributos del script.

Mantener el centro del nuevo visual en la misma posicion de la entidad. El atributo `radius` controla la activacion y no se ajusta automaticamente al tamaño del modelo.

## 16. Respawn automatico

El respawn automatico esta implementado dentro de `arcadeCar`.

### Problema que resuelve

Con una pista nueva, un jugador puede salir demasiado lejos, quedar mal orientado o perder mucho tiempo intentando regresar. En un evento esto bloquea la partida y reduce la rotacion de participantes.

### Comportamiento actual

1. Mientras el auto circula, conservar un historial corto de posiciones y orientaciones.
2. Si permanece fuera de asfalto durante 2.5 segundos, iniciar la recuperacion.
3. Detectar el salto de recuperacion generado por `arcadeCar`.
4. Retroceder aproximadamente `respawnDelay + 0.75` segundos dentro de su propio historial.
5. Restaurar una posicion anterior sobre la pista y la orientacion que llevaba al circular correctamente.
6. Dejar su velocidad en cero.
7. Mantener intactos jugador, nombre, color, vuelta, tiempo y camara.
8. Esperar algunos segundos antes de permitir otro respawn.
9. Mostrar `VOLVIENDO A PISTA...` en el celular al detectar la reposicion.

No utiliza puntos manuales de respawn. La referencia se obtiene del historial real de cada auto antes de abandonar la pista.

### Parametros configurables

Seleccionar `Root > Player Car > Script > arcadeCar`:

| Parametro | Valor | Funcion |
| --- | ---: | --- |
| `respawnDelay` | 2.5 | Segundos continuos fuera del asfalto antes de reaparecer. |
| `respawnCooldown` | 3 | Espera minima antes de permitir otro respawn. |

Los autos clonados para `P2-P4` heredan estos valores de `Player Car`.

El observador `raceTelemetry`, instalado en `Root`, incluye:

| Parametro | Valor | Funcion |
| --- | ---: | --- |
| `sendInterval` | 0.25 | Frecuencia de telemetria hacia el celular. |
| `respawnDistance` | 4 | Salto minimo de posicion para reconocer una reposicion. |

### Criterio de aceptacion

- Salir brevemente al cesped no provoca respawn.
- Permanecer fuera de pista durante 2.5 segundos devuelve el auto.
- El auto reaparece mirando en una direccion util.
- No suma ni elimina vueltas.
- Funciona de manera independiente para los 4 jugadores.
- No necesita Ammo.js ni componentes Rigidbody.

### Motivo de implementacion

Es una mejora pequeña y aislada dentro de `arcadeCar`, pero evita que una carrera quede bloqueada. No modifica vueltas, tiempos, nombre, color ni camara.

### Mejoras futuras

- Mostrar `Volviendo a pista...` en el celular.
- Agregar un efecto visual al reaparecer.
- Aplicar una penalizacion de tiempo configurable.
- Detectar un auto inmovil durante demasiado tiempo.
