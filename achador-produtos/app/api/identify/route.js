export async function POST(request) {
  try {
    const { imageBase64, mimeType, apiKey } = await request.json();

    if (!apiKey) {
      return Response.json({ error: 'API key não fornecida.' }, { status: 400 });
    }

    const prompt = `Você é um especialista em identificação de produtos e comparação de preços no Brasil.

Analise a imagem e retorne APENAS um JSON válido, sem markdown, sem backticks, sem texto adicional:

{
  "nome": "Nome completo do produto com marca e modelo se identificável",
  "categoria": "Categoria do produto",
  "descricao": "Descrição em 2-3 frases do que é o produto e para que serve",
  "caracteristicas": ["característica 1", "característica 2", "característica 3"],
  "termos_ml": "termos de busca para Mercado Livre Brasil 3-6 palavras chave",
  "termos_busca": "termos para busca geral",
  "faixa_min": 50,
  "faixa_tipico": 100,
  "faixa_max": 200,
  "lojas_especiais": ["nome de loja especializada se aplicável"]
}

Para faixas de preço, use valores numéricos em reais (sem R$). Se não conseguir identificar o produto, retorne {"erro": "Não foi possível identificar o produto na imagem."}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: prompt }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = geminiData?.error?.message || 'Erro na API do Gemini.';
      return Response.json({ error: msg }, { status: 400 });
    }

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const product = JSON.parse(clean);

    if (product.erro) {
      return Response.json({ error: product.erro }, { status: 422 });
    }

    // Build store links
    const q = encodeURIComponent(product.termos_ml || product.termos_busca);
    const qHifen = (product.termos_ml || product.termos_busca).replace(/\s+/g, '-');

    const lojas = [
      { nome: 'Mercado Livre', url: `https://lista.mercadolivre.com.br/${qHifen}`, preco: product.faixa_min },
      { nome: 'Amazon BR', url: `https://www.amazon.com.br/s?k=${q}`, preco: Math.round(product.faixa_tipico * 1.05) },
      { nome: 'Magazine Luiza', url: `https://www.magazineluiza.com.br/busca/${q}/`, preco: Math.round(product.faixa_tipico * 1.08) },
      { nome: 'Shopee', url: `https://shopee.com.br/search?keyword=${q}`, preco: Math.round(product.faixa_min * 0.95) },
      { nome: 'Americanas', url: `https://www.americanas.com.br/busca/${q}`, preco: product.faixa_tipico },
    ];

    // Add specialist stores based on category
    const cat = (product.categoria || '').toLowerCase();
    if (cat.includes('medic') || cat.includes('farm') || cat.includes('saúde')) {
      lojas.push({ nome: 'Droga Raia', url: `https://www.drogaraia.com.br/busca?q=${q}`, preco: Math.round(product.faixa_tipico * 0.98) });
      lojas.push({ nome: 'Ultrafarma', url: `https://www.ultrafarma.com.br/busca?q=${q}`, preco: Math.round(product.faixa_min * 0.9) });
    }
    if (cat.includes('decor') || cat.includes('móv') || cat.includes('mov') || cat.includes('casa')) {
      lojas.push({ nome: 'Tok&Stok', url: `https://www.tokstok.com.br/busca/?ft=${q}`, preco: Math.round(product.faixa_tipico * 1.1) });
      lojas.push({ nome: 'Mobly', url: `https://www.mobly.com.br/catalogsearch/result/?q=${q}`, preco: product.faixa_tipico });
    }
    if (cat.includes('eletr') || cat.includes('tecno') || cat.includes('inform')) {
      lojas.push({ nome: 'KaBuM!', url: `https://www.kabum.com.br/busca/${qHifen}`, preco: Math.round(product.faixa_min * 0.97) });
      lojas.push({ nome: 'Fast Shop', url: `https://www.fastshop.com.br/web/p/s?q=${q}`, preco: Math.round(product.faixa_tipico * 1.05) });
    }

    lojas.sort((a, b) => a.preco - b.preco);

    return Response.json({ product, lojas });

  } catch (err) {
    return Response.json({ error: 'Erro ao processar a imagem. Tente novamente.' }, { status: 500 });
  }
}
