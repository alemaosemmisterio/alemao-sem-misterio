import type { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'a1-personal-introduction',
    title: 'Apresentação pessoal',
    description: 'Apresente-se e compartilhe informações básicas sobre você.',
    level: 'A1',
    emoji: '👋',
    type: 'conversation',
    persona: 'um novo colega em um curso de alemão que quer te conhecer melhor.'
  },
  {
    id: 'a1-restaurant-order',
    title: 'No restaurante',
    description: 'Peça comida e bebida em um restaurante e peça a conta.',
    level: 'A1',
    emoji: '🍝',
    type: 'conversation',
    persona: 'um garçom simpático anotando seu pedido.'
  },
    {
    id: 'a1-bakery-order',
    title: 'Pedindo na padaria',
    description: 'Peça pães, bolos e café em uma padaria alemã.',
    level: 'A1',
    emoji: '🥐',
    type: 'conversation',
    persona: 'um simpático padeiro recebendo seu pedido.'
  },
  {
    id: 'a1-eiscafe-order',
    title: 'Na sorveteria (Eiscafé)',
    description: 'Escolha e peça seus sabores de sorvete favoritos.',
    level: 'A1',
    emoji: '🍦',
    type: 'conversation',
    persona: 'um vendedor em uma sorveteria alemã.'
  },
  {
    id: 'a1-supermarket-shopping',
    title: 'Compras no supermercado',
    description: 'Encontre produtos e pergunte sobre preços em um supermercado.',
    level: 'A1',
    emoji: '🛒',
    type: 'conversation',
    persona: 'um funcionário de supermercado que você pergunta onde encontrar um item.'
  },
    {
    id: 'a1-clothing-shopping',
    title: 'Comprando roupas',
    description: 'Pergunte sobre tamanhos, cores e preços em uma loja.',
    level: 'A1',
    emoji: '👕',
    type: 'conversation',
    persona: 'um vendedor prestativo em uma loja de roupas.'
  },
  {
    id: 'a1-flea-market',
    title: 'Na feira de usados (Flohmarkt)',
    description: 'Pergunte o preço de um item e tente negociar um pouco.',
    level: 'A1',
    emoji: '🎪',
    type: 'conversation',
    persona: 'um vendedor em uma barraca de mercado de pulgas.'
  },
  {
    id: 'a1-airport-checkin',
    title: 'No aeroporto',
    description: 'Faça o check-in para um voo e despache sua bagagem.',
    level: 'A1',
    emoji: '✈️',
    type: 'conversation',
    persona: 'um agente de check-in no balcão da companhia aérea.'
  },
    {
    id: 'a1-hotel-problem',
    title: 'No hotel',
    description: 'Comunique um problema no seu quarto, como o Wi-Fi não funcionando.',
    level: 'A1',
    emoji: '🏨',
    type: 'conversation',
    persona: 'um recepcionista de hotel tentando resolver um problema para você.'
  },
  {
    id: 'a1-directions-transport',
    title: 'Direções / transporte público',
    description: 'Peça e dê informações sobre como chegar a um lugar.',
    level: 'A1',
    emoji: '🗺️',
    type: 'conversation',
    persona: 'um turista na rua pedindo ajuda para encontrar a estação de trem.'
  },
  {
    id: 'a1-hobbies',
    title: 'Falando sobre hobbies',
    description: 'Converse sobre seus passatempos e o que você gosta de fazer no tempo livre.',
    level: 'A1',
    emoji: '🎨',
    type: 'conversation',
    persona: 'um novo amigo que quer saber mais sobre seus interesses.'
  },
  {
    id: 'a1-household-chores',
    title: 'Tarefas domésticas',
    description: 'Converse sobre tarefas de casa, como limpar ou cozinhar.',
    level: 'A1',
    emoji: '🧹',
    type: 'conversation',
    persona: 'um colega de apartamento com quem você está dividindo as tarefas.'
  },
  {
    id: 'a1-family-talk',
    title: 'Falando sobre família',
    description: 'Descreva sua família e pergunte sobre a família de outra pessoa.',
    level: 'A1',
    emoji: '👨‍👩‍👧‍👦',
    type: 'conversation',
    persona: 'um amigo curioso querendo saber mais sobre sua família.'
  },
  {
    id: 'a1-profession',
    title: 'Profissão',
    description: 'Fale sobre sua profissão e o que você faz no trabalho.',
    level: 'A1',
    emoji: '💼',
    type: 'conversation',
    persona: 'alguém sentado ao seu lado em um trem puxando conversa.'
  },
  {
    id: 'a1-routine-schedule',
    title: 'Rotina e horários',
    description: 'Descreva seu dia a dia e fale sobre seus horários.',
    level: 'A1',
    emoji: '⏰',
    type: 'conversation',
    persona: 'um amigo planejando uma atividade com você durante a semana.'
  },
  {
    id: 'a1-food-drinks',
    title: 'Comidas e bebidas favoritas',
    description: 'Converse sobre o que você gosta de comer e beber.',
    level: 'A1',
    emoji: '🍕',
    type: 'conversation',
    persona: 'um novo amigo em um jantar.'
  },
  {
    id: 'a1-health-doctor',
    title: 'Saúde e médico',
    description: 'Descreva sintomas simples em uma consulta médica.',
    level: 'A1',
    emoji: '👨‍⚕️',
    type: 'conversation',
    persona: 'um médico em uma consulta de rotina.'
  },
  {
    id: 'a1-electronics-store',
    title: 'Loja de eletrônicos',
    description: 'Peça ajuda para encontrar um produto e pergunte sobre suas características.',
    level: 'A1',
    emoji: '🎧',
    type: 'conversation',
    persona: 'um vendedor em uma loja de eletrônicos mostrando um novo fone de ouvido.'
  },
  {
    id: 'a1-future-plans',
    title: 'Planos para o futuro',
    description: 'Fale sobre o que você gostaria de fazer no próximo fim de semana ou nas férias.',
    level: 'A1',
    emoji: '🗓️',
    type: 'conversation',
    persona: 'um amigo perguntando sobre seus planos para o futuro.'
  },
  {
    id: 'a1-christmas-market',
    title: 'No mercado de Natal',
    description: 'Compre comidas típicas e presentes em um Weihnachtsmarkt.',
    level: 'A1',
    emoji: '🎄',
    type: 'conversation',
    persona: 'um vendedor em uma barraca de Glühwein (vinho quente) no mercado de Natal.'
  },
  {
    id: 'a1-past-stories',
    title: 'Histórias do passado',
    description: 'Conte algo simples que você fez ontem ou no último fim de semana (Perfekt).',
    level: 'A1',
    emoji: '🕰️',
    type: 'conversation',
    persona: 'um amigo curioso perguntando como foi seu fim de semana.'
  },
  {
    id: 'a1-wishes-wants',
    title: 'Desejos e vontades',
    description: 'Expresse o que você gostaria de ter ou fazer usando "möchten".',
    level: 'A1',
    emoji: '✨',
    type: 'conversation',
    persona: 'um amigo conversando com você sobre sonhos e desejos para o futuro.'
  },
  {
    id: 'a1-organize-event',
    title: 'Organizando um evento',
    description: 'Combine um encontro com amigos, sugerindo um lugar e horário.',
    level: 'A1',
    emoji: '🎉',
    type: 'conversation',
    persona: 'um amigo te ligando para combinar uma festa de aniversário surpresa.'
  },
  {
    id: 'a1-sports-talk',
    title: 'Conversando sobre esportes',
    description: 'Fale sobre esportes que você gosta de praticar ou assistir.',
    level: 'A1',
    emoji: '⚽',
    type: 'conversation',
    persona: 'um novo conhecido descobrindo que vocês torcem para o mesmo time.'
  },
    {
    id: 'a1-simple-email',
    title: 'Escrever e-mails simples',
    description: 'Escreva um e-mail curto para um amigo ou colega.',
    level: 'A1',
    emoji: '📧',
    type: 'writing',
    persona: 'um assistente de IA que te ajuda a rascunhar um e-mail.'
  },
  {
    id: 'a1-form-filling',
    title: 'Preenchendo formulário',
    description: 'Pratique preencher um formulário de inscrição simples com suas informações pessoais.',
    level: 'A1',
    emoji: '📝',
    type: 'writing',
    persona: 'um assistente de IA que te guia no preenchimento de um formulário de matrícula para um curso.'
  }
];