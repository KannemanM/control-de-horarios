# Turnos · Planilla de horarios

Planilla simple para cargar horarios de entrada y salida de cada operario y
calcular automáticamente las horas diarias y semanales. La semana va de lunes a
sábado.

Aplicación web independiente con **Next.js + TypeScript + PostgreSQL**. No
depende de WordPress ni de ningún servicio externo.

## Producción con Docker Compose

La app y PostgreSQL corren en contenedores separados. La base usa el volumen
persistente `pgdata`, así que no se pierde al reiniciar o recrear los
contenedores.

### 1. Configurar variables

```bash
cp .env.example .env
```

Completar en `.env`:

```env
POSTGRES_DB=control_horarios
POSTGRES_USER=control
POSTGRES_PASSWORD=una-clave-larga
AUTH_SECRET=una-clave-aleatoria-muy-larga
ADMIN_PASSWORD=una-clave-inicial-segura
```

`DATABASE_URL` del `.env` se usa para desarrollo local. Dentro de Docker Compose
la app se conecta automáticamente a `db:5432`. Si cambiás `POSTGRES_PASSWORD`,
actualizá también la contraseña dentro de `DATABASE_URL` para desarrollo local.

Generar claves sin caracteres problemáticos:

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 32   # AUTH_SECRET
```

### 2. Arrancar

```bash
docker compose up -d --build
```

El contenedor de la app:

1. aplica las migraciones de Prisma;
2. crea el administrador si todavía no existe;
3. arranca Next.js en el puerto 3000.

La primera vez se entra con `ADMIN_PASSWORD`. Después conviene cambiarla desde
**Cambiar contraseña**, en el pie del menú lateral.

No se cargan operarios ni turnos de ejemplo en producción. La base arranca
únicamente con el administrador.

Para verificar el arranque:

```bash
docker compose ps
docker compose logs -f app
```

### 3. Dokploy

1. Subir el proyecto a GitHub/Gitea.
2. Crear un servicio **Docker Compose** en Dokploy.
3. Usar `docker-compose.yml` y el `Dockerfile` del repositorio.
4. Cargar `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `AUTH_SECRET` y
   `ADMIN_PASSWORD` en las variables de entorno.
5. Agregar el dominio al servicio `app`, puerto **3000**, con HTTPS.
6. No agregar dominio ni puerto público al servicio `db`.
7. Deploy.

Dokploy/Traefik se encarga del HTTPS. La app usa cookies `secure` en producción,
así que el login debe probarse desde el dominio HTTPS, no desde una IP por HTTP.

Si Dokploy usa Traefik con la red `dokploy-network`, verificá que el servicio
`app` quede conectado a esa red. La UI de Dokploy normalmente lo resuelve al
agregar el dominio; si no, hay que agregarla como red externa en el compose.

Usá contraseñas sin `#`, `$`, `@`, `:` ni `/` en `.env` para evitar problemas
de interpolación y de URL. Las claves generadas con `openssl rand -hex` no
tienen esos caracteres.

Si no usás Dokploy para publicar el dominio, descomentá en
`docker-compose.yml`:

```yaml
    ports:
      - "3000:3000"
```

### 4. Backup

El volumen no es un backup. Hacer dumps periódicos:

```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backup.dump
```

No usar `docker compose down -v`: elimina el volumen `pgdata` y todos los datos.

## Desarrollo local

Se necesita un PostgreSQL local. El `.env` de desarrollo debe apuntar a
`localhost`:

```env
DATABASE_URL="postgresql://control:control@localhost:5432/control_horarios?schema=public"
```

Después:

```bash
npm install
npm run setup   # migra, genera Prisma y carga datos de ejemplo
npm run dev
```

Abrir http://localhost:3000

`npm run setup` y `npm run db:seed` son para desarrollo: el seed **borra** los
datos y crea 3 operarios de ejemplo con contraseña `admin123`. No ejecutarlos en
producción.

Para desarrollo sin datos de ejemplo:

```bash
npm run db:migrate:deploy
ADMIN_PASSWORD=una-clave-local node --env-file=.env scripts/bootstrap.mjs
npm run dev
```

## Cómo se usa

1. Entrá a **Operarios** y agregá a las personas con su nombre.
2. Entrá a **Planilla**, elegí el mes y el operario (o “Todos”).
3. La planilla muestra una matriz semanal: los operarios en filas y los días de
   **lunes a sábado** en columnas. Cada día tiene **Entrada**, **Salida** y
   **Total**; al final de cada semana está el **Total semana** del operario.
4. Completá las horas como `09:00`; también se aceptan atajos como `9`, `900` o
   `0900`.
5. El cambio se guarda solo al salir del campo.
6. El **total diario**, el **total semanal por operario** y el **total del mes**
   se calculan automáticamente.

Para borrar un día, dejá Entrada y Salida vacías. El domingo no forma parte de
la semana y no se muestra en la planilla.

## Funcionalidades

- **Operarios:** alta, edición de nombre y eliminación.
- **Planilla:** matriz semanal de lunes a sábado, edición directa en la tabla y
  filtro por operario o todos.
- **Totales:** horas del día, total de cada semana por operario y total mensual.
- **Navegación:** en celular la matriz se desplaza horizontalmente; la columna
  del operario queda fija para no perder la referencia.
- **Impresión:** botón para imprimir la planilla actual en A4 horizontal, con el
  mes, el operario seleccionado (o todos) y los colores de la app. Puede ocupar
  dos hojas; las semanas no se cortan entre páginas.
- **Turnos nocturnos:** si la salida es menor que la entrada, se suma un día.
- **Un solo horario por operario y día.**
- **Zona horaria fija:** America/Argentina/Buenos_Aires (UTC-3).
- **Diseño tipo planilla:** semanas separadas, filas compactas, día actual
  resaltado y totales destacados.

## Comandos

```bash
npm run dev                # servidor de desarrollo
npm run build              # build de producción
npm run start              # servidor de producción
npm run db:migrate         # crear/aplicar migraciones en desarrollo
npm run db:migrate:deploy  # aplicar migraciones existentes
npm run db:seed            # cargar datos de ejemplo (borra todo, solo local)
npm run db:reset           # resetear la base y cargar datos de ejemplo
```

## Estructura

```
app/
  (panel)/
    planilla/       matriz semanal editable (lunes a sábado)
    operarios/      alta y edición de operarios
  login/            acceso con contraseña
components/         sidebar, modales y componentes de interfaz
lib/                cálculo de horas, fechas y autenticación
prisma/
  schema.prisma     modelo de datos PostgreSQL
  migrations/       migraciones versionadas
  seed.ts           datos de ejemplo para desarrollo
scripts/
  bootstrap.mjs     crea el administrador inicial en producción
docker/
  entrypoint.sh     migraciones + bootstrap + arranque
Dockerfile
docker-compose.yml
```

## Notas

- La base de producción es PostgreSQL y vive en el volumen `pgdata`.
- El servicio `db` no se publica a Internet.
- Los datos de prueba de SQLite no se migraron; la base nueva arranca con el
  administrador únicamente.
- Mantené `AUTH_SECRET` estable: si cambia, se invalidan las sesiones.
- Si cambiás el esquema, creá una migración con `npm run db:migrate` y volvé a
  desplegar. El entrypoint aplica las migraciones pendientes.
- Para imprimir los colores de la planilla, activá **Gráficos de fondo** en el
  diálogo de impresión del navegador.
