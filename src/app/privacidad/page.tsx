const SECCIONES = [
  {
    titulo: "1. Qué datos recopilamos",
    texto:
      "Al usar Moorcado recopilamos los datos que registras directamente (nombre, correo, teléfono, departamento, tipo de cuenta, documento de identidad si solicitas verificación) y los que generas al usar la plataforma (publicaciones, mensajes, favoritos, reseñas, reportes).",
  },
  {
    titulo: "2. Para qué usamos tus datos",
    texto:
      "Usamos tus datos para crear y proteger tu cuenta, mostrar tus publicaciones en el marketplace, conectar compradores y vendedores mediante el chat, enviarte notificaciones sobre tu actividad, verificar tu identidad si la solicitas, y moderar reportes y apelaciones.",
  },
  {
    titulo: "3. Con quién se comparte",
    texto:
      "No vendemos tus datos personales a terceros. Tu nombre, calificación y publicaciones son visibles públicamente en el marketplace, como corresponde a un mercado abierto. Tu correo, teléfono y documento de identidad no se muestran públicamente y solo los usa nuestro equipo de moderación cuando es necesario.",
  },
  {
    titulo: "4. Dónde se guardan tus datos",
    texto:
      "Tus datos se almacenan en Supabase (base de datos en la nube) y, como caché temporal, en el almacenamiento local de tu navegador. Trabajamos con proveedores de infraestructura estándar de la industria.",
  },
  {
    titulo: "5. Tus derechos",
    texto:
      "Puedes revisar y corregir tus datos desde tu Perfil en cualquier momento. Si quieres eliminar tu cuenta o tienes dudas sobre tus datos personales, escríbenos a soporte@moorcado.hn.",
  },
  {
    titulo: "6. Cookies y almacenamiento local",
    texto:
      "Usamos el almacenamiento local del navegador (localStorage) para mantener tu sesión iniciada y acelerar la carga de la app. No usamos cookies de rastreo publicitario de terceros.",
  },
  {
    titulo: "7. Cambios a esta política",
    texto:
      "Podemos actualizar esta Política de Privacidad ocasionalmente. Si hacemos cambios importantes, lo indicaremos en esta misma página.",
  },
];

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Política de privacidad
      </h1>
      <p className="mt-2 text-moorcado-gray-dark/60">
        Última actualización: 2026.
      </p>

      <div className="mt-8 space-y-6">
        {SECCIONES.map(({ titulo, texto }) => (
          <section key={titulo}>
            <h2 className="font-display font-bold text-moorcado-gray-dark">{titulo}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-moorcado-gray-dark/70">
              {texto}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
