export function parseBBCredentials(text) {
  const result = {};
  const names = { appkey: 'appKey', clientid: 'clientId', clientsecret: 'clientSecret' };
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^\s*(appKey|clientID|clientSecret)\s*[:=]\s*(.+?)\s*$/i);
    if (match) result[names[match[1].toLowerCase()]] = match[2];
  }
  if (!result.appKey || !result.clientId || !result.clientSecret) throw new Error('Arquivo inválido: procure App Key, Client ID e Client Secret no arquivo exportado pelo BB.');
  return result;
}
