'use strict';

// ===========================================================================
// Translations. The English text is the key (gettext style); anything without a
// translation simply shows in English. {name} placeholders are filled by t().
// To add a language: add it to I18N and LANG_NAMES, and to LANGS in server.js.
// ===========================================================================
const LANG_NAMES = { en: 'English', es: 'Español' };

const I18N = {
  es: {
    // generic
    'OK': 'Aceptar', 'Cancel': 'Cancelar', 'Delete': 'Eliminar', 'Close': 'Cerrar', 'Language': 'Idioma',
    'Your session has expired. Please log in again.': 'Tu sesión ha caducado. Inicia sesión de nuevo.',
    'Request failed ({n})': 'La solicitud falló ({n})',

    // header / login / account
    'Files': 'Archivos', 'Admin': 'Administración', 'Account': 'Cuenta', 'Log out': 'Cerrar sesión',
    'Username': 'Usuario', 'Password': 'Contraseña', 'Log in': 'Iniciar sesión',
    'Sign in to your private file storage': 'Inicia sesión en tu almacenamiento privado de archivos',
    'Welcome! Please choose a new password before continuing.': '¡Bienvenido! Elige una contraseña nueva antes de continuar.',
    'Current password': 'Contraseña actual',
    'New password (min. 8 characters)': 'Nueva contraseña (mín. 8 caracteres)',
    'Repeat new password': 'Repite la nueva contraseña',
    'Change password': 'Cambiar contraseña',
    'New password must be at least 8 characters': 'La nueva contraseña debe tener al menos 8 caracteres',
    "New passwords don't match": 'Las contraseñas nuevas no coinciden',
    'Password changed': 'Contraseña cambiada',

    // files view
    'Go to my files': 'Ir a mis archivos', 'My files': 'Mis archivos',
    '{size} used · no storage limit': '{size} usados · sin límite de almacenamiento',
    '{used} of {quota} used ({free} free)': '{used} de {quota} usados ({free} libres)',
    'Upload': 'Subir', 'New folder': 'Nueva carpeta', 'More': 'Más',
    'Download this folder as .zip': 'Descargar esta carpeta como .zip', 'Refresh': 'Actualizar',
    '{n} selected': '{n} seleccionados', 'Move': 'Mover', 'Clear': 'Limpiar',
    'Select all': 'Seleccionar todo', '{n} item': '{n} elemento', '{n} items': '{n} elementos',
    '{shown} of {total} items': '{shown} de {total} elementos',
    'Filter this folder…': 'Filtrar esta carpeta…', 'Filter this folder': 'Filtrar esta carpeta',
    'Sort': 'Ordenar', 'Name': 'Nombre', 'Size': 'Tamaño', 'Modified': 'Modificado',
    'List view': 'Vista de lista', 'Grid view': 'Vista de cuadrícula',
    'Select {name}': 'Seleccionar {name}', 'Actions': 'Acciones', 'Actions for {name}': 'Acciones para {name}',
    'Folder': 'Carpeta',
    'This folder is empty': 'Esta carpeta está vacía',
    'Drag files here or use the Upload button.': 'Arrastra archivos aquí o usa el botón Subir.',
    'No matches': 'Sin resultados', 'Nothing in this folder matches “{q}”.': 'Nada en esta carpeta coincide con “{q}”.',
    'Drop files to upload': 'Suelta los archivos para subirlos',

    // actions & dialogs
    'Open': 'Abrir', 'View contents': 'Ver contenido', 'Extract here': 'Extraer aquí', 'Preview': 'Vista previa',
    'Download as .zip': 'Descargar como .zip', 'Download': 'Descargar', 'Rename': 'Renombrar', 'Move to…': 'Mover a…',
    'Folder name': 'Nombre de la carpeta', 'e.g. Photos 2026': 'p. ej. Fotos 2026', 'Create': 'Crear', 'New name': 'Nuevo nombre',
    'Permanently delete {label}? Folders are deleted with everything inside. This cannot be undone.':
      '¿Eliminar {label} de forma permanente? Las carpetas se eliminan con todo su contenido. Esto no se puede deshacer.',
    'Deleted': 'Eliminado',
    'Move "{name}"': 'Mover "{name}"', 'Move {n} items': 'Mover {n} elementos',
    'Destination folder': 'Carpeta de destino', '/ (My files)': '/ (Mis archivos)', 'Moved': 'Movido',
    'Extracting…': 'Extrayendo…', 'Extracted to "{name}"': 'Extraído en "{name}"',

    // uploads
    'Uploads': 'Subidas', 'Waiting': 'En espera',
    'Uploading {n} file': 'Subiendo {n} archivo', 'Uploading {n} files': 'Subiendo {n} archivos',
    'Uploads finished': 'Subidas finalizadas', '{pct}% of {size}': '{pct}% de {size}', 'Saving…': 'Guardando…', 'Done': 'Listo',
    'Not enough space: {total} selected, {free} free.': 'Espacio insuficiente: {total} seleccionados, {free} libres.',
    '"{name}" is larger than the {size} per-file limit.': '"{name}" supera el límite de {size} por archivo.',
    'Upload failed (connection lost or rejected)': 'Falló la subida (conexión perdida o rechazada)',
    'Upload failed ({n})': 'Falló la subida ({n})',

    // previews
    'Open in new tab': 'Abrir en una pestaña nueva', 'Loading…': 'Cargando…',
    "Can't preview this file": 'No se puede mostrar la vista previa de este archivo',
    'This workbook is empty': 'Este libro está vacío', 'This sheet is empty': 'Esta hoja está vacía',
    'First {shown} of {total} rows': 'Primeras {shown} de {total} filas',
    '{n} row': '{n} fila', '{n} rows': '{n} filas',
    '{shown} of {total} columns': '{shown} de {total} columnas', '{n} column': '{n} columna', '{n} columns': '{n} columnas',
    'download for the full sheet': 'descarga el archivo para ver la hoja completa',
    'Could not load file': 'No se pudo cargar el archivo',
    '… (preview limited to the first 1 MB — download to see everything)': '… (vista previa limitada al primer 1 MB — descarga el archivo para verlo completo)',

    // zip viewer
    "Couldn't open this zip": 'No se pudo abrir este zip',
    '{n} file': '{n} archivo', '{n} files': '{n} archivos', 'files': 'archivos',
    'uncompressed': 'sin comprimir', 'compressed': 'comprimidos', '({pct}% saved)': '({pct}% de ahorro)',
    '{n} password-protected': '{n} con contraseña',
    'Showing first {shown} of {total} entries': 'Mostrando las primeras {shown} de {total} entradas',
    'Empty': 'Vacío', 'locked': 'bloqueado',
    'This file is password-protected inside the zip': 'Este archivo está protegido con contraseña dentro del zip',
    'Download this file': 'Descargar este archivo', 'Download zip': 'Descargar zip',
    'Extract this file here': 'Extraer este archivo aquí', 'Extract this file to…': 'Extraer este archivo en…',
    'Extract file': 'Extraer archivo', 'Extract': 'Extraer', 'Extracted "{name}"': 'Se extrajo "{name}"',

    // admin
    'Manage who can log in and how much each person can store.': 'Gestiona quién puede iniciar sesión y cuánto puede guardar cada persona.',
    'Server disk': 'Disco del servidor', '{size} free': '{size} libres', 'of {size}': 'de {size}',
    'Stored by users': 'Almacenado por usuarios', '{n} user': '{n} usuario', '{n} users': '{n} usuarios',
    'Quota allocated': 'Cuota asignada', 'More than the disk can hold': 'Más de lo que cabe en el disco',
    'Users with no limit not counted': 'No se cuentan los usuarios sin límite',
    'Max upload per file': 'Subida máxima por archivo', 'Set MAX_FILE_SIZE_MB to change': 'Cambia MAX_FILE_SIZE_MB para modificarlo',
    'Add a user': 'Añadir un usuario', 'Storage limit (GB, 0 = none)': 'Límite de almacenamiento (GB, 0 = ninguno)',
    'Add user': 'Añadir usuario', 'e.g. carolina': 'p. ej. carolina', 'min. 8 characters': 'mín. 8 caracteres',
    'User "{name}" created': 'Usuario "{name}" creado',
    'User': 'Usuario', 'Storage': 'Almacenamiento', 'Created': 'Creado', 'no limit': 'sin límite',
    'admin': 'admin', 'disabled': 'deshabilitado', 'you': 'tú',
    'Change storage limit': 'Cambiar límite de almacenamiento', 'Reset password': 'Restablecer contraseña',
    'Enable account': 'Habilitar cuenta', 'Disable account': 'Deshabilitar cuenta',
    'Remove admin rights': 'Quitar permisos de administrador', 'Make admin': 'Hacer administrador',
    'Delete user and files': 'Eliminar usuario y archivos',
    'Account enabled': 'Cuenta habilitada', 'Account disabled': 'Cuenta deshabilitada', 'Role updated': 'Rol actualizado',
    'Storage limit for {name}': 'Límite de almacenamiento de {name}', 'Currently using {size}.': 'Actualmente usa {size}.',
    'Limit in GB (0 = no limit)': 'Límite en GB (0 = sin límite)', 'Save': 'Guardar', 'Storage limit updated': 'Límite de almacenamiento actualizado',
    'New password for {name}': 'Nueva contraseña para {name}',
    'Ask them to choose their own password at next login': 'Pedirle que elija su propia contraseña en el próximo inicio de sesión',
    'Set password': 'Establecer contraseña', 'Password updated': 'Contraseña actualizada',
    'Delete {name}?': '¿Eliminar a {name}?',
    'This removes the account and permanently deletes all of their files ({size}). Type the username to confirm.':
      'Esto elimina la cuenta y borra de forma permanente todos sus archivos ({size}). Escribe el nombre de usuario para confirmar.',
    'Delete user': 'Eliminar usuario', 'User deleted': 'Usuario eliminado',
    "Username didn't match — nothing was deleted": 'El nombre de usuario no coincide: no se eliminó nada',

    // messages that come from the server (matched on their exact English text)
    'Invalid path': 'Ruta no válida', 'Forbidden': 'Prohibido', 'Not logged in': 'No has iniciado sesión',
    'Please change your password first': 'Primero cambia tu contraseña', 'Admins only': 'Solo para administradores',
    'Too many failed attempts. Try again in 15 minutes.': 'Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.',
    'This account is disabled': 'Esta cuenta está deshabilitada',
    'Wrong username or password': 'Usuario o contraseña incorrectos',
    'Current password is incorrect': 'La contraseña actual es incorrecta',
    'Folder not found': 'Carpeta no encontrada', 'Invalid folder name': 'Nombre de carpeta no válido',
    'Something with that name already exists': 'Ya existe algo con ese nombre',
    'Cannot rename the root folder': 'No se puede renombrar la carpeta raíz', 'Invalid name': 'Nombre no válido',
    'Not found': 'No encontrado', 'Destination folder not found': 'Carpeta de destino no encontrada',
    'Cannot move a folder into itself': 'No se puede mover una carpeta dentro de sí misma',
    'Not enough storage space left for this upload': 'No queda espacio de almacenamiento para esta subida',
    'File not found': 'Archivo no encontrado', 'Zip file not found': 'Archivo zip no encontrado',
    'Entry not found in zip': 'Entrada no encontrada en el zip',
    'This file type cannot be previewed': 'No se puede mostrar una vista previa de este tipo de archivo',
    'This file expands to too much data to preview safely. Download it instead.': 'Este archivo se expande a demasiados datos para mostrarlo con seguridad. Descárgalo en su lugar.',
    'This file took too long to convert for a preview. Download it instead.': 'Este archivo tardó demasiado en convertirse para la vista previa. Descárgalo en su lugar.',
    'This file is too large or complex to preview. Download it instead.': 'Este archivo es demasiado grande o complejo para la vista previa. Descárgalo en su lugar.',
    'Could not preview this file': 'No se pudo mostrar la vista previa de este archivo',
    'This file looks corrupted or is not a valid Office document': 'Este archivo parece dañado o no es un documento de Office válido',
    'This file is password-protected and cannot be previewed': 'Este archivo está protegido con contraseña y no se puede previsualizar',
    'This file is password-protected inside the zip and cannot be opened here': 'Este archivo está protegido con contraseña dentro del zip y no se puede abrir aquí',
    'Zip has too many entries to extract': 'El zip tiene demasiadas entradas para extraerlo',
    'This zip is password-protected and cannot be extracted here': 'Este zip está protegido con contraseña y no se puede extraer aquí',
    'Not enough storage space left to extract this zip': 'No queda espacio de almacenamiento para extraer este zip',
    'Not enough storage space left to extract this file': 'No queda espacio de almacenamiento para extraer este archivo',
    'Quota must be a number of GB (0 = unlimited)': 'La cuota debe ser un número de GB (0 = ilimitada)',
    'Username must be 2-32 characters: letters, numbers, dot, dash or underscore': 'El usuario debe tener de 2 a 32 caracteres: letras, números, punto, guion o guion bajo',
    'That username is taken': 'Ese nombre de usuario ya está en uso',
    'Password must be at least 8 characters': 'La contraseña debe tener al menos 8 caracteres',
    'User not found': 'Usuario no encontrado',
    "You can't disable your own account": 'No puedes deshabilitar tu propia cuenta',
    "You can't change your own admin role": 'No puedes cambiar tu propio rol de administrador',
    "You can't delete your own account": 'No puedes eliminar tu propia cuenta',
    'Unsupported language': 'Idioma no compatible', 'Server error': 'Error del servidor',
  },
};

// Server messages that carry a variable part
const ERR_PATTERNS = {
  es: [
    [/^Could not read zip: (.*)$/, 'No se pudo leer el zip: $1'],
    [/^Could not preview this file: (.*)$/, 'No se pudo mostrar la vista previa de este archivo: $1'],
    [/^File is larger than the (\d+) MB limit$/, 'El archivo supera el límite de $1 MB'],
    [/^This file is too big to preview \(over (\d+) MB\)\. Download it instead\.$/, 'Este archivo es demasiado grande para la vista previa (más de $1 MB). Descárgalo en su lugar.'],
  ],
};

// ---------------------------------------------------------------------------
let LANG = 'en';

function detectLang() {
  try {
    const saved = localStorage.getItem('bks.lang');
    if (saved && (saved === 'en' || I18N[saved])) return saved;
  } catch {}
  const nav = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
  return I18N[nav] ? nav : 'en';
}

/** Translate `s` (an English string) and fill {placeholders} from `vars`. */
function t(s, vars) {
  let out = (LANG !== 'en' && I18N[LANG] && I18N[LANG][s]) || s;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return out;
}

/** Translate a message that came from the server. */
function tErr(msg) {
  msg = String(msg);
  if (LANG === 'en') return msg;
  const exact = I18N[LANG] && I18N[LANG][msg];
  if (exact) return exact;
  for (const [re, tpl] of ERR_PATTERNS[LANG] || []) if (re.test(msg)) return msg.replace(re, tpl);
  return msg;
}

/** "1 row" / "5 rows": pass the two keys */
const plural = (n, one, many) => t(n === 1 ? one : many, { n: n.toLocaleString(LANG) });

/** Switch language locally (no re-render, no server call). */
function setLangLocal(lang) {
  LANG = lang === 'en' || I18N[lang] ? lang : 'en';
  try { localStorage.setItem('bks.lang', LANG); } catch {}
  document.documentElement.lang = LANG;
}

LANG = detectLang();
document.documentElement.lang = LANG;
