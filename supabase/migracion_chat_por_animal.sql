-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Bug real: conversacionId() (src/lib/mensajesDb.ts) armaba el id de una
-- conversación solo con el par de usuarios — animal_id sí es una columna
-- real por mensaje, pero nunca era parte de la clave. Si le escribías al
-- mismo vendedor sobre 2 animales distintos, ambas conversaciones se
-- mezclaban en un único hilo. La clave nueva es
-- "usuarioMenor__usuarioMayor__animalId" (o "...__general" para el único
-- caso real sin animal: mensajes sobre una solicitud "Busco X" desde
-- SolicitudesClient.tsx, que no está ligada a ningún anuncio).
--
-- Esta migración recalcula conversacion_id de todo el historial con la
-- fórmula nueva para que no quede huérfano.
--
-- Límite aceptado: si algún reporte de tipo "chat" ya existente apuntaba a
-- una conversación que esta migración divide en varias (porque cubría más
-- de un animal), ese reporte viejo puede quedar apuntando a un id que ya
-- no agrupa exactamente lo mismo que agrupaba cuando se creó. Los reportes
-- de chat nuevos, de aquí en adelante, sí son exactos. No se intenta
-- reconstruir reportes viejos porque no hay forma de saber, sin ambigüedad,
-- a cuál de las conversaciones resultantes se refería el reporte original.

update mensajes
set conversacion_id =
  least(autor_id, destinatario_id) || '__' || greatest(autor_id, destinatario_id)
  || '__' || coalesce(animal_id, 'general');
