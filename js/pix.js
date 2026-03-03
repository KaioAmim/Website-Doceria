// ============================================
// PIX.JS
// Biblioteca para geração de código PIX (BR Code)
// ============================================

/**
 * @param {string} chavePix - Chave PIX 
 * @param {string} nomeBeneficiario - Nome do beneficiário
 * @param {number} valor - Valor da transação
 * @param {string} cidade - Cidade do beneficiário
 * @param {string} identificador - Identificador da transação (opcional)
 * @returns {string} Código PIX Copia e Cola
 */
function gerarCodigoPix(chavePix, nomeBeneficiario, valor, cidade, identificador = '***') {
    // Payload Format Indicator
    const payloadFormatIndicator = gerarEMV('00', '01');
    
    // Merchant Account Information
    const merchantAccountInfo = gerarMerchantAccountInfo(chavePix);
    
    // Merchant Category Code
    const merchantCategoryCode = gerarEMV('52', '0000');
    
    // Transaction Currency (986 = BRL)
    const transactionCurrency = gerarEMV('53', '986');
    
    // Transaction Amount
    const transactionAmount = gerarEMV('54', valor.toFixed(2));
    
    // Country Code
    const countryCode = gerarEMV('58', 'BR');
    
    // Merchant Name
    const merchantName = gerarEMV('59', nomeBeneficiario.substring(0, 25));
    
    // Merchant City
    const merchantCity = gerarEMV('60', cidade.substring(0, 15));
    
    // Additional Data Field Template
    const additionalDataField = gerarAdditionalDataField(identificador);
    
    // Concatenar todos os campos
    let payload = payloadFormatIndicator +
                  merchantAccountInfo +
                  merchantCategoryCode +
                  transactionCurrency +
                  transactionAmount +
                  countryCode +
                  merchantName +
                  merchantCity +
                  additionalDataField;
    
    // CRC16
    payload += '6304'; // ID do CRC16
    const crc = calcularCRC16(payload);
    payload += crc;
    
    return payload;
}

/**
 * Gera um campo EMV
 * @param {string} id - ID do campo
 * @param {string} value - Valor do campo
 * @returns {string} Campo EMV formatado
 */
function gerarEMV(id, value) {
    const tamanho = value.length.toString().padStart(2, '0');
    return id + tamanho + value;
}

/**
 * Gera o Merchant Account Information
 * @param {string} chavePix - Chave PIX
 * @returns {string} Merchant Account Information formatado
 */
function gerarMerchantAccountInfo(chavePix) {
    // GUI (Globally Unique Identifier) do PIX
    const gui = gerarEMV('00', 'br.gov.bcb.pix');
    
    // Chave PIX
    const chave = gerarEMV('01', chavePix);
    
    const merchantAccount = gui + chave;
    
    return gerarEMV('26', merchantAccount);
}

/**
 * Gera o Additional Data Field Template
 * @param {string} identificador - Identificador da transação
 * @returns {string} Additional Data Field formatado
 */
function gerarAdditionalDataField(identificador) {
    const txid = gerarEMV('05', identificador);
    return gerarEMV('62', txid);
}

/**
 * Calcula o CRC16 CCITT
 * @param {string} payload - Payload para calcular o CRC
 * @returns {string} CRC16 em hexadecimal
 */
function calcularCRC16(payload) {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    
    for (let i = 0; i < payload.length; i++) {
        const byte = payload.charCodeAt(i);
        crc ^= (byte << 8);
        
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc = crc << 1;
            }
        }
    }
    
    crc = crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Remove caracteres especiais da chave PIX
 * @param {string} chave - Chave PIX
 * @returns {string} Chave PIX limpa
 */
function limparChavePix(chave) {
    // Remove espaços, pontos, hífens, parênteses
    return chave.replace(/[\s.\-()]/g, '');
}
