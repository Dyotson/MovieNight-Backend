# MovieNight Backend

Este proyecto es un ejercicio de aprendizaje para explorar Express.js y experimentar con el despliegue de backends serverless en Vercel. MovieNight es una aplicación que permite a los usuarios organizar sesiones de noche de cine, proponer películas y votar por ellas para decidir qué ver.

## Descripción General

MovieNight Backend es una API RESTful construida con Express.js y Sequelize que se conecta a The Movie Database (TMDB) para obtener información de películas. La aplicación permite a los usuarios:

- Crear sesiones de noche de cine
- Invitar a amigos mediante enlaces compartibles
- Buscar y proponer películas
- Votar por las películas propuestas
- Ver estadísticas de votación

## Tecnologías Utilizadas

- **Express.js**: Framework para la creación de la API
- **Sequelize**: ORM para trabajar con PostgreSQL
- **PostgreSQL**: Base de datos relacional
- **Axios**: Cliente HTTP para comunicación con la API de TMDB
- **Nanoid**: Generación de tokens únicos para sesiones
- **Vercel**: Despliegue serverless

## Estructura del Proyecto

```
MovieNight-Backend/
├── config/           # Configuración de la base de datos
├── controllers/      # Lógica de negocio
├── models/           # Modelos de datos (Sequelize)
├── routes/           # Definición de rutas
├── middleware/       # Middlewares personalizados
├── index.js          # Punto de entrada de la aplicación
├── vercel.json       # Configuración para despliegue en Vercel
└── package.json      # Dependencias y scripts
```

## Modelos de Datos

### Movie
Almacena información de películas obtenidas de TMDB para reducir llamadas a la API externa.

### MovieNight
Representa una sesión de noche de cine con fecha, nombre, y configuraciones como límites de propuestas y votos.

### MovieProposal
Películas propuestas para una sesión de MovieNight, incluye conteo de votos.

### MovieNightUser
Usuarios que se han unido a una sesión, con seguimiento de sus votos.

## API Endpoints

### Sesiones de MovieNight

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/nights` | Crear una nueva sesión |
| `POST` | `/api/nights/:token/join` | Unirse a una sesión |
| `GET`  | `/api/nights/:token` | Obtener información de una sesión |
| `POST` | `/api/nights/:token/propose` | Proponer una película |
| `POST` | `/api/nights/:token/vote/:tmdbId` | Votar por una película |
| `GET`  | `/api/nights/:token/users` | Obtener usuarios de una sesión |
| `GET`  | `/api/nights/:token/stats` | Obtener estadísticas de votación |

### Películas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/api/movies/search?query=` | Buscar películas |
| `GET`  | `/api/movies/popular` | Obtener películas populares |
| `GET`  | `/api/movies/cached` | Obtener películas en caché |
| `GET`  | `/api/movies/:id` | Obtener detalles de una película |

## Características Principales

1. **Sistema de Caché**: Almacena datos de películas para reducir llamadas a la API de TMDB.
2. **Tokens Únicos**: Cada sesión tiene un token de 5 caracteres para facilitar el acceso.
3. **Límites Configurables**: El creador puede establecer límites para propuestas y votos.
4. **Seguimiento de Votos**: Registra qué usuarios han votado por cada película.
5. **Estadísticas en Tiempo Real**: Proporciona información sobre la participación y preferencias.

## Configuración para Desarrollo

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/MovieNight-Backend.git
   cd MovieNight-Backend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear un archivo .env con las siguientes variables:
   ```
   PORT=3000
   TMDB_API_KEY=tu_clave_de_api_tmdb
   DATABASE_URL=tu_url_de_postgresql
   ```

4. Iniciar el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Vercel

Este proyecto está configurado para desplegarse en Vercel como un backend serverless. La configuración se encuentra en el archivo vercel.json. Para desplegar:

1. Instalar la CLI de Vercel:
   ```bash
   npm i -g vercel
   ```

2. Desplegar:
   ```bash
   vercel
   ```

3. Configurar las variables de entorno en el panel de Vercel:
   - `TMDB_API_KEY`
   - `DATABASE_URL`
   - `VERCEL=1`
   - `NODE_ENV=production`

## Consideraciones de Producción

- El enfoque serverless de Vercel impone algunas limitaciones en la persistencia de conexiones.
- La configuración del pool de conexiones a la base de datos está optimizada para entornos serverless.
- Se recomienda usar una base de datos con buena capacidad de conexiones concurrentes.

## Lecciones Aprendidas

- Implementación de un sistema de caché para reducir llamadas API externas
- Adaptación de un backend tradicional a una arquitectura serverless
- Manejo de relaciones complejas en modelos de datos con Sequelize
- Diseño de un sistema de votación con seguimiento de participación por usuario

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

---

Este proyecto fue creado con fines educativos para aprender Express.js y explorar el despliegue de backends en entornos serverless como Vercel.