# Tablero de proyectos — Equipo ERP

Tablero para registrar y seguir los proyectos del equipo: estados, módulos, fases, mejoras, cronograma e indicadores. Es una página estática (HTML, CSS y JavaScript) publicada en GitHub Pages, con los datos en Supabase.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Estilos (estándar de imagen Zubex) |
| `app.js` | Lógica del tablero y conexión con Supabase |
| `config.js` | URL del proyecto de Supabase y llave publicable |

## Seguridad

- El repositorio **no contiene contraseñas ni llaves secretas**.
- `config.js` solo lleva la **llave publicable** de Supabase, que está diseñada para usarse en el navegador.
- Para ver o guardar datos hay que **iniciar sesión** y además estar dado de alta en la tabla `equipo`. Las reglas de seguridad (RLS) viven en la base de datos, no en esta página.
- El registro público de usuarios está **desactivado**: el administrador da de alta a cada persona.
- Nunca subas la llave secreta (`sb_secret_…` / `service_role`) ni la contraseña de la base de datos.

## Dar de alta a una persona

1. En Supabase: **Authentication → Users → Add user → Create new user**. Captura correo y contraseña y marca *Auto Confirm User*.
2. En **SQL Editor**, agrégala al equipo (correo en minúsculas):

   ```sql
   insert into public.equipo (email, nombre) values ('correo@empresa.com', 'Nombre Apellido');
   ```

Para quitarle el acceso: bórrala de `public.equipo` y elimínala en **Authentication → Users**.

## Actualizar la página

Sube los archivos modificados al repositorio; GitHub Pages publica los cambios en uno o dos minutos.
