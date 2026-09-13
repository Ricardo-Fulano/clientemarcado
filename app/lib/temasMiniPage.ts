// Fonte unica de verdade dos modelos/temas de cor da MiniPage - extraido de
// app/painel/perfil/aparencia/page.tsx (que ja usava essa lista antes desta extracao) pra
// evitar 2 listas divergentes no sistema (essa e a lib/tema-publico.ts, usada so pela
// renderizacao da pagina publica). A pagina de aparencia passou a importar daqui, sem
// nenhuma mudanca de comportamento - mesmos ids, nomes, descricoes e cores de antes.
export const TEMAS_MINIPAGE = [
  { id: 'modelo1', nome: 'Modelo 1', desc: 'Rosa vibrante, moderno e marcante.', p: '#FF4FA3', s: '#D946EF' },
  { id: 'modelo2', nome: 'Modelo 2', desc: 'Preto e grafite, premium e minimalista.', p: '#EDEDF0', s: '#A1A1AA' },
  { id: 'modelo3', nome: 'Modelo 3', desc: 'Grafite e preto, moderno e sofisticado.', p: '#1C1C1F', s: '#0A0A0B' },
  { id: 'modelo4', nome: 'Modelo 4', desc: 'Preto e dourado, visual luxuoso e de alto padrão.', p: '#D4AF37', s: '#9C7A2F' },
  { id: 'modelo5', nome: 'Modelo 5', desc: 'Cinza claro e branco, clean e editorial.', p: '#C97B93', s: '#8B5D73' },
  { id: 'modelo6', nome: 'Modelo 6', desc: 'Branco e cinza suave, refinado e elegante.', p: '#5FA8A0', s: '#3D7871' },
  { id: 'modelo7', nome: 'Modelo 7', desc: 'Rosa blush premium, ideal para beleza e estética.', p: '#F5C3D6', s: '#E83E8C' },
  { id: 'modelo8', nome: 'Modelo 8', desc: 'Rosa forte premium, marcante e feminino.', p: '#F1B6CF', s: '#C2185B' },
  { id: 'modelo9', nome: 'Modelo 9', desc: 'Lilás profundo, sofisticado e marcante.', p: '#B69AF0', s: '#8B6FD9' },
  { id: 'modelo10', nome: 'Modelo 10', desc: 'Nude e mocha, acolhedor e refinado.', p: '#A67C52', s: '#7A5A3A' },
  { id: 'modelo11', nome: 'Modelo 11', desc: 'Bordô profundo, elegante e marcante.', p: '#7F1D1D', s: '#BE123C' },
  { id: 'modelo12', nome: 'Modelo 12', desc: 'Azul-meia-noite, premium e versátil.', p: '#3B82F6', s: '#10243D' },
  { id: 'modelo13', nome: 'Modelo 13', desc: 'Vermelho neon, intenso, moderno e impactante.', p: '#FF1744', s: '#FF6B85' },
  { id: 'modelo14', nome: 'Modelo 14', desc: 'Verde neon, vibrante, moderno e tecnológico.', p: '#00FF85', s: '#6FFFB0' },
  { id: 'modelo15', nome: 'Modelo 15', desc: 'Azul neon, marcante, sofisticado e digital.', p: '#00BFFF', s: '#66D9FF' },
  { id: 'modelo16', nome: 'Modelo 16', desc: 'Rosa neon, forte, feminino e super marcante.', p: '#FF2DAA', s: '#FF7ACB' },
  { id: 'modelo17', nome: 'Modelo 17', desc: 'Laranja neon, energético, criativo e ousado.', p: '#FF7A00', s: '#FFB066' },
  { id: 'modelo18', nome: 'Modelo 18', desc: 'Dourado neon, luxuoso, intenso e premium.', p: '#FFD700', s: '#FFEB80' },
]
