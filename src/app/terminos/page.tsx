const SECCIONES = [
  {
    titulo: "1. Qué es Moorcado",
    texto:
      "Moorcado es un mercado digital que conecta a ganaderos, empresas, veterinarios y compradores en Honduras para publicar, buscar y negociar la compra-venta de ganado.",
  },
  {
    titulo: "2. Cuentas de usuario",
    texto:
      "Eres responsable de la veracidad de la información que registras y de mantener tu contraseña en privado. Moorcado puede suspender cuentas que incumplan estos términos.",
  },
  {
    titulo: "3. Publicaciones",
    texto:
      "El vendedor es responsable de que la información, fotos y precio publicados sean reales y actuales. Moorcado puede desactivar publicaciones reportadas que incumplan estas condiciones.",
  },
  {
    titulo: "4. Verificación",
    texto:
      "La verificación de una cuenta indica que el usuario envió información de contacto e identidad revisada por nuestro equipo. No constituye una garantía sobre la calidad de los animales publicados.",
  },
  {
    titulo: "5. Transacciones",
    texto:
      "Moorcado facilita el contacto entre comprador y vendedor, pero no participa directamente en el pago ni la entrega del animal. Cada transacción es responsabilidad de ambas partes.",
  },
  {
    titulo: "6. Reportes y moderación",
    texto:
      "Cualquier usuario puede reportar publicaciones o conversaciones que incumplan estos términos. Nuestro equipo de moderación revisa los reportes y puede tomar acciones como desactivar contenido o cuentas.",
  },
  {
    titulo: "7. Estado y salud del ganado",
    texto:
      "Moorcado no inspecciona físicamente los animales publicados ni garantiza su estado de salud, edad, peso, preñez, genealogía o cualquier otra característica declarada por el vendedor. Es responsabilidad del comprador verificar el animal (idealmente en persona o con un veterinario) antes de cerrar la compra. Moorcado no es responsable por enfermedades, vicios ocultos, muerte del animal ni por diferencias entre lo publicado y el animal real.",
  },
  {
    titulo: "8. Límite de responsabilidad",
    texto:
      "En la máxima medida permitida por la ley, Moorcado no será responsable por daños directos, indirectos, incidentales o derivados del uso de la plataforma, de transacciones entre usuarios, de información falsa publicada por terceros, ni de pérdidas económicas relacionadas con la compra-venta de ganado. El uso de Moorcado es bajo tu propio riesgo.",
  },
  {
    titulo: "9. Edad mínima",
    texto:
      "Para crear una cuenta y usar Moorcado debes ser mayor de 18 años o contar con autorización de tu padre, madre o tutor legal si eres menor de edad.",
  },
  {
    titulo: "10. Privacidad",
    texto:
      "El tratamiento de tus datos personales se describe en nuestra Política de Privacidad, que forma parte de estos Términos y Condiciones.",
  },
];

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Términos y condiciones
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
