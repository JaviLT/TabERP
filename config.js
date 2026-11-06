/*
  Configuración del Tablero de proyectos — Equipo ERP

  Pega aquí los datos de tu proyecto de Supabase
  (Project Settings → API Keys y Data API / Project URL).

  - supabaseUrl: la URL del proyecto, termina en .supabase.co
  - supabaseKey: la llave PUBLICABLE (empieza con sb_publishable_…) o la "anon" de las llaves legacy.

  La llave publicable está hecha para ir en el navegador: por sí sola no da acceso a los datos,
  porque la base exige iniciar sesión y estar dado de alta en la tabla "equipo".

  NUNCA pongas aquí la llave secreta (sb_secret_… o service_role), la contraseña de la base
  de datos ni ninguna contraseña de usuario. Si la página detecta una llave secreta, no arranca.
*/
window.TABLERO_CONFIG = {
  supabaseUrl: "https://vjfqqbywfehgqquhmdbq.supabase.co",
  supabaseKey: "sb_publishable_cfvDagnK9aQ1uUe_6mayLA_IsKOAecq"
};
