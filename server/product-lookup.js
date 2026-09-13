const cache = new Map();
const verifiedProducts = new Map([
  ['7891035325595', { found: true, barcode: '7891035325595', name: 'Bom Ar Campos de Lavanda Embalagem Econômica 360 ml', category: 'Limpeza', unit: 'Unidade', quantity: '360 ml', source: 'Catálogo do fabricante' }],
]);

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function inferCategory(product) {
  const text = normalize([product.product_name, product.product_name_pt, product.categories, ...(product.categories_tags || [])].join(' '));
  if (product.product_type === 'beauty' || /(desodor|shampoo|sabonete|higiene|toothpaste|creme dental|cosmetic)/.test(text)) return 'Higiene Pessoal';
  if (/(deterg|limpeza|sabao em po|desinfet|cleaning)/.test(text)) return 'Limpeza';
  if (/(bebida|refrigerante|agua|cerveja|suco|drink|beverage)/.test(text)) return 'Bebidas';
  if (/(laticinio|queijo|leite|iogurte|dairy|cheese)/.test(text)) return 'Frios e Laticínios';
  if (/(congelad|frozen|ice cream|sorvete)/.test(text)) return 'Congelados';
  if (/(padaria|pao|bolo|bakery|bread)/.test(text)) return 'Padaria';
  if (/(carne|frango|linguica|meat|poultry)/.test(text)) return 'Açougue';
  if (/(fruta|verdura|legume|hortifruti|fruit|vegetable)/.test(text)) return 'Hortifruti';
  return product.product_type === 'food' ? 'Mercearia' : 'Outros';
}

export async function lookupProduct(barcode, fetcher = fetch) {
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(barcode)) throw new Error('Informe um código EAN/UPC/GTIN válido.');
  if (verifiedProducts.has(barcode)) return verifiedProducts.get(barcode);
  const cached = cache.get(barcode);
  if (cached && Date.now() - cached.at < 86400000) return cached.value;
  const fields = 'code,product_name,product_name_pt,generic_name_pt,brands,categories,categories_tags,quantity,product_quantity,product_quantity_unit,product_type';
  const options = {
    headers: { 'User-Agent': 'MiniPrecoPDV/1.0 (local desktop application; product lookup)', 'Accept-Language': 'pt-BR,pt;q=0.9' },
    signal: AbortSignal.timeout(12000), redirect: 'follow',
  };
  let product;
  let reachedDatabase = false;
  try {
    const response = await fetcher(`https://world.openfoodfacts.org/api/v3/product/${barcode}.json?product_type=all&fields=${fields}`, options);
    reachedDatabase = true;
    if (response.ok) product = (await response.json()).product;
  } catch { /* tenta as bases específicas abaixo */ }

  if (!product) {
    const databases = [
      ['https://world.openfoodfacts.org', 'food'],
      ['https://world.openbeautyfacts.org', 'beauty'],
      ['https://world.openproductsfacts.org', 'product'],
      ['https://world.openpetfoodfacts.org', 'petfood'],
    ];
    const attempts = await Promise.allSettled(databases.map(async ([domain, type]) => {
      const response = await fetcher(`${domain}/api/v2/product/${barcode}.json?fields=${fields}`, options);
      reachedDatabase = true;
      if (!response.ok) return null;
      const body = await response.json();
      return body.status === 1 && body.product ? { ...body.product, product_type: body.product.product_type || type } : null;
    }));
    product = attempts.find(attempt => attempt.status === 'fulfilled' && attempt.value)?.value;
  }
  if (!product) {
    if (reachedDatabase) return { found: false };
    throw new Error('Não foi possível consultar o cadastro público agora. Verifique a internet e tente novamente.');
  }
  const baseName = String(product.product_name_pt || product.product_name || product.generic_name_pt || '').trim();
  if (!baseName) return { found: false };
  const brand = String(product.brands || '').split(',')[0].trim();
  const name = brand && !normalize(baseName).includes(normalize(brand)) ? `${baseName} ${brand}` : baseName;
  const value = { found: true, barcode, name, category: inferCategory(product), unit: 'Unidade', quantity: product.quantity || null, source: 'Open Food Facts' };
  cache.set(barcode, { at: Date.now(), value });
  return value;
}
