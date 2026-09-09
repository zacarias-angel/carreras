# Event Racing Game - Manual de usuario y configuracion

Este manual describe como ejecutar, operar y ajustar el proyecto actual. Los cambios de configuracion se dividen entre el servidor local, el controller web y la escena de PlayCanvas.

## 1. Estructura del proyecto

### Archivos locales

- `carreras/server.js`: servidor HTTP, WebSocket, jugadores, lobby, countdown y resultados.
- `carreras/public/controller.html`: interfaz que se abre en cada celular.
- `carreras/package.json`: dependencias y comando de inicio.
- `event_racing_game_recomendaciones.md`: recomendaciones originales del producto.
- `event_racing_game_checklist.md`: estado actual y tareas pendientes.
- `event_racing_game_manual_usuario.md`: este manual.

### Elementos principales en PlayCanvas

- Entidad `Root`: contiene los scripts generales.
- Script `localMultiplayer`: conecta la pantalla con el servidor y crea autos/camaras.
- Script `raceManager`: administra parrilla, vueltas, tiempos, posiciones y resultados.
- Script `viewportFrames`: dibuja marcos, etiquetas y asigna materiales.
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
4. `P1` inicia la carrera.
5. Aparece una cuenta regresiva de 5 segundos.
6. Los autos quedan bloqueados hasta `YA!`.
7. Cada jugador completa 3 vueltas.
8. La pantalla actualiza posiciones usando vueltas y progreso.
9. Cada jugador recibe su resultado al terminar.
10. Cuando terminan todos, se muestra el podio.
11. Despues de 12 segundos el sistema vuelve al lobby.

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
const totalLaps = 3;
```

Cambiar `3` por la cantidad deseada. Mantener sincronizado el atributo `totalLaps` de `raceManager` en PlayCanvas.

### Maximo de jugadores

Actualmente el servidor busca lugares de `P1` a `P4` y rechaza valores mayores a 4. Para aumentar el limite no alcanza con modificar el servidor: tambien deben ampliarse parrilla, colores, viewports y materiales en PlayCanvas.

### Countdown

Dentro de `startCountdown`, buscar:

```js
let seconds = 5;
```

Cambiar `5` por la duracion deseada.

### Duracion de resultados

El regreso al lobby utiliza:

```js
lobbyTimer = setTimeout(returnToLobby, 12000);
```

El valor esta expresado en milisegundos. `12000` equivale a 12 segundos.

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

### Volumen del motor

Buscar en `startEngine`:

```js
gain.gain.exponentialRampToValueAtTime(.17, now + .08);
```

`.17` es el volumen actual. Aumentarlo con cuidado para evitar distorsion en parlantes de celular.

### Tono del motor

Las frecuencias principales son:

```js
low.frequency.setValueAtTime(58, now);
low.frequency.exponentialRampToValueAtTime(105, now + .7);
high.frequency.setValueAtTime(29, now);
high.frequency.exponentialRampToValueAtTime(52, now + .7);
```

Valores mayores generan un motor mas agudo.

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

## 6. Configuracion de autos en PlayCanvas

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

## 7. Movimiento y cesped

Seleccionar `Root > Player Car > Script > arcadeCar`.

### Parametros actuales

| Parametro | Valor | Funcion |
| --- | ---: | --- |
| `maxSpeed` | 30 | Velocidad maxima sobre asfalto. |
| `acceleration` | 20 | Rapidez para acelerar y desacelerar. |
| `steerSpeed` | 120 | Velocidad de giro. |
| `grassSpeedMultiplier` | 0.20 | Porcentaje de velocidad disponible en cesped. |

Ejemplos:

- Mas velocidad: subir `maxSpeed` gradualmente.
- Giro mas suave: bajar `steerSpeed` de `120` a `100`.
- Cesped mas lento: bajar `grassSpeedMultiplier` de `0.20` a `0.12`.
- Cesped menos severo: subirlo a `0.30`.

### Deteccion de asfalto

La deteccion principal proyecta la posicion de cada auto sobre los triangulos de la malla. La superficie se considera asfalto cuando el punto del auto queda dentro de uno de esos triangulos.

La entidad actual es `sm_F1AR_pista > pista` y tiene:

- Tag `asphalt`.
- Render asset `306017766`.

Este metodo no necesita Ammo.js, Collision ni Rigidbody. Para una pista nueva, colocar el tag `asphalt` sobre la entidad Render que representa su superficie transitable.

La malla de colision deberia ser simple, tener un espesor vertical aproximado de `0.1` a `0.3` unidades y exportarse con transformaciones aplicadas cuando sea posible.

## 8. Camara

Los parametros se encuentran en `Player Car > Script > arcadeCar`.

| Parametro | Valor | Funcion |
| --- | ---: | --- |
| `cameraHeight` | 18 | Altura de la camara. |
| `cameraDistance` | 12 | Separacion horizontal fija. |
| `cameraOrthoHeight` | 21 | Cantidad de pista visible. |
| `cameraSmoothness` | 0.3 | Suavizado del seguimiento. |

Para ver mas pista, subir `cameraOrthoHeight`. Para acercar la vista, bajarlo.

La camara usa una orientacion mundial fija para evitar que la pista rote al doblar.

## 9. Parrilla, vueltas y posiciones

Script: `raceManager` en la entidad `Root`.

### Parrilla

Las posiciones iniciales estan en `positionStartingGrid`, dentro del arreglo `slots`.

Todas usan coordenadas X negativas para quedar antes de la linea de salida. Si se mueve la linea, tambien deben ajustarse estos puntos.

### Deteccion de vueltas

Una vuelta se valida cuando:

1. El auto cruza inicialmente la linea.
2. Llega a la zona opuesta con `z > 8`.
3. Vuelve a cruzar desde `x < 0` hasta `x >= 0` con `z < -8`.

Si se rediseña la pista, deben actualizarse esos umbrales.

### Posiciones

La clasificacion usa:

```text
vueltas completadas + progreso angular dentro del ovalo
```

Los radios de referencia son `34.5` y `19.5`. Deben coincidir aproximadamente con el ovalo de la pista.

## 10. Viewports

Script: `viewportFrames` en la entidad `Root`.

Distribucion actual:

- 1 jugador: pantalla completa.
- 2 jugadores: dos columnas.
- 3 jugadores: grilla con tres cuadrantes usados.
- 4 jugadores: grilla `2 × 2`.

El arreglo `colors` define el color de cada marco. Los resultados personales no se muestran sobre los viewports para no tapar el tiempo ni la carrera.

## 11. Resultado final

El servidor recibe desde PlayCanvas:

- jugador;
- tiempo total;
- mejor vuelta.

El orden de llegada define la posicion. La diferencia se calcula contra el tiempo del ganador.

El resultado se muestra en dos lugares:

- Podio general en la pantalla principal.
- Pantalla personal en el celular.

Actualmente los tiempos de vuelta se calculan en PlayCanvas y el servidor centraliza los resultados. Para una version competitiva resistente a trampas, el servidor deberia calcular directamente los timestamps.

## 12. Solucion de problemas

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

## 13. Secuencia segura para realizar cambios

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

## 14. Zonas de velocidad

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

## 15. Proximo paso minimo viable

El siguiente agregado recomendado es el **respawn automatico**.

### Problema que resuelve

Con una pista nueva, un jugador puede salir demasiado lejos, quedar mal orientado o perder mucho tiempo intentando regresar. En un evento esto bloquea la partida y reduce la rotacion de participantes.

### Comportamiento propuesto

1. Mientras el auto circula sobre `asphalt`, guardar una posicion y orientacion valida.
2. Si permanece fuera de asfalto durante 2.5 segundos, iniciar la recuperacion.
3. Reubicarlo en la ultima posicion valida.
4. Dejar su velocidad en cero.
5. Mantener intactos jugador, nombre, color, vuelta, tiempo y camara.
6. Esperar algunos segundos antes de permitir otro respawn.

### Criterio de aceptacion

- Salir brevemente al cesped no provoca respawn.
- Permanecer fuera de pista durante 2.5 segundos devuelve el auto.
- El auto reaparece mirando en una direccion util.
- No suma ni elimina vueltas.
- Funciona de manera independiente para los 4 jugadores.
- No necesita Ammo.js ni componentes Rigidbody.

### Motivo de prioridad

Es una mejora pequeña y aislada dentro de `arcadeCar`, pero evita que una carrera quede bloqueada. Por confiabilidad aporta mas al siguiente build que agregar nuevos power-ups, sonidos o efectos visuales.
