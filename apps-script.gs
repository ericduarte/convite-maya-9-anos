/**
 * Grava as confirmações do convite da Maya numa planilha do Google.
 *
 * Como usar:
 * 1. Crie uma planilha nova no Google Sheets.
 * 2. Menu Extensões → Apps Script. Apague o que estiver lá e cole este código. Salve.
 * 3. Implantar → Nova implantação → tipo "App da Web".
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 4. Autorize o acesso e copie o link que termina em /exec.
 * 5. Cole esse link em SHEETS_URL no script.js.
 *
 * Já tinha implantado a versão antiga? Cole este código por cima, salve e vá em
 * Implantar → Gerenciar implantações → ✏️ editar → Versão: "Nova versão" → Implantar.
 * Assim o link /exec continua o mesmo.
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Data/Hora', 'Nome', 'Acompanhantes', 'Vai?', 'Total de pessoas', 'Recado para a Maya']);
  } else if (!sheet.getRange('F1').getValue()) {
    sheet.getRange('F1').setValue('Recado para a Maya'); // planilha criada pela versão antiga
  }

  const data = JSON.parse(e.postData.contents);
  const going = data.attending === true;
  const guests = Math.max(0, Math.min(10, parseInt(data.guests, 10) || 0));
  // Evita que um nome começando com "=" vire fórmula na planilha
  const clean = (text, max) => String(text || '').trim().slice(0, max).replace(/^[=+\-@]/, "'$&");
  const name = clean(data.name, 80);
  const message = clean(data.message, 300);

  sheet.appendRow([new Date(), name, guests, going ? 'Sim' : 'Não', going ? guests + 1 : 0, message]);
  return ContentService.createTextOutput('ok');
}
